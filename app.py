"""
LTX-2 Distilled — Professional Gradio Interface
=================================================
A polished, production-ready Gradio web application for the LTX-2 Distilled
text/image-to-video pipeline.  Generates audio-video content in two distilled
stages (8+4 denoising steps) for fast, high-quality results.

Launch:
    PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python app.py \
        --distilled-checkpoint-path /path/to/distilled.safetensors \
        --spatial-upsampler-path   /path/to/upsampler.safetensors \
        --gemma-root               /path/to/gemma
"""

from __future__ import annotations

import argparse
import logging
import os
import tempfile
import time
import uuid
from pathlib import Path

import gradio as gr
import torch

# ---------------------------------------------------------------------------
#  LTX-2 imports (workspace packages)
# ---------------------------------------------------------------------------
from ltx_core.loader import LTXV_LORA_COMFY_RENAMING_MAP, LoraPathStrengthAndSDOps
from ltx_core.model.video_vae import TilingConfig, get_video_chunks_number
from ltx_core.quantization import QuantizationPolicy

from ltx_pipelines.distilled import DistilledPipeline
from ltx_pipelines.utils.args import ImageConditioningInput
from ltx_pipelines.utils.constants import DEFAULT_IMAGE_CRF, DEFAULT_NEGATIVE_PROMPT
from ltx_pipelines.utils.media_io import encode_video

# Blackwell Optimizations Imports
import subprocess
from threading import Semaphore
from collections.abc import Iterator
from ltx_core.types import LatentState, Audio
from ltx_core.components.protocols import DiffusionStepProtocol

# ---------------------------------------------------------------------------
#  Constants
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(tempfile.gettempdir()) / "ltx2_outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
#  Blackwell Concurrency & Performance Config
# ---------------------------------------------------------------------------
MAX_CONCURRENT_GENS = 4   # 96GB VRAM can handle ~4-6 parallel 1080p sessions
MAX_CPU_TASKS = 2        # Guard for 6 vCPUs (Text encoding/IO)
CPU_LOCK = Semaphore(MAX_CPU_TASKS)

# Frame counts must satisfy  num_frames = 8k + 1
VALID_FRAME_COUNTS = [9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257]

# Two-stage resolution: must be divisible by 64
PRESET_RESOLUTIONS = {
    # ── Landscape (16:9, 3:2, etc.) ──
    "1920 × 1088  (1080p Landscape)": (1088, 1920),
    "1280 × 768   (720p Landscape)": (768, 1280),
    "1536 × 1024  (3:2 Landscape)": (1024, 1536),
    "1024 × 768   (4:3 Landscape)": (768, 1024),
    "832 × 576    (Fast Landscape)": (576, 832),
    # ── Portrait (9:16, 2:3, etc.) ──
    "1088 × 1920  (1080p Portrait)": (1920, 1088),
    "768 × 1280   (720p Portrait)": (1280, 768),
    "1024 × 1536  (2:3 Portrait)": (1536, 1024),
    "768 × 1024   (3:4 Portrait)": (1024, 768),
    "576 × 832    (Fast Portrait)": (832, 576),
    # ── Square ──
    "1024 × 1024  (Square)": (1024, 1024),
    "768 × 768    (Square Small)": (768, 768),
}

DEFAULT_PROMPT = (
    "A dramatic aerial shot of a futuristic coastal city at golden hour. "
    "Glass skyscrapers reflect the warm sunset light while autonomous vehicles "
    "glide silently along illuminated highways. Waves gently crash against "
    "the modern seawalls below."
)

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
#  Blackwell Performance Override
# ---------------------------------------------------------------------------
class BlackwellDistilledPipeline(DistilledPipeline):
    """
    Subclass to keep models resident in 96GB VRAM and avoid synchronization/cleanup overhead.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._transformer = None
        self._video_encoder = None
        self._upsampler = None
        self._vae_decoder = None
        self._audio_decoder = None
        self._vocoder = None

    def __call__(
        self,
        prompt: str,
        seed: int,
        height: int,
        width: int,
        num_frames: int,
        frame_rate: float,
        images: list[ImageConditioningInput],
        tiling_config: TilingConfig | None = None,
        enhance_prompt: bool = False,
    ) -> tuple[Iterator[torch.Tensor], Audio]:
        # Implementation optimized for persistent models in VRAM
        from ltx_pipelines.utils.helpers import (
            assert_resolution,
            combined_image_conditionings,
            denoise_audio_video,
            encode_prompts,
            simple_denoising_func,
        )
        from ltx_pipelines.utils.samplers import euler_denoising_loop
        from ltx_core.components.diffusion_steps import EulerDiffusionStep
        from ltx_core.components.noisers import GaussianNoiser
        from ltx_pipelines.utils.constants import DISTILLED_SIGMA_VALUES, STAGE_2_DISTILLED_SIGMA_VALUES
        from ltx_core.types import VideoPixelShape
        from ltx_core.model.upsampler import upsample_video
        from ltx_core.model.video_vae import decode_video as vae_decode_video
        from ltx_core.model.audio_vae import decode_audio as vae_decode_audio
        
        assert_resolution(height=height, width=width, is_two_stage=True)
        generator = torch.Generator(device=self.device).manual_seed(seed)
        noiser = GaussianNoiser(generator=generator)
        stepper = EulerDiffusionStep()
        dtype = torch.bfloat16

        (ctx_p,) = encode_prompts(
            [prompt],
            self.model_ledger,
            enhance_first_prompt=enhance_prompt,
            enhance_prompt_image=images[0].path if len(images) > 0 else None,
        )
        video_context, audio_context = ctx_p.video_encoding, ctx_p.audio_encoding

        # Cache models in the pipeline instance
        if self._video_encoder is None:
            self._video_encoder = self.model_ledger.video_encoder()
        if self._transformer is None:
            self._transformer = self.model_ledger.transformer()
            
        video_encoder = self._video_encoder
        transformer = self._transformer
        
        stage_1_sigmas = torch.Tensor(DISTILLED_SIGMA_VALUES).to(self.device)

        def denoising_loop(
            sigmas: torch.Tensor, video_state: LatentState, audio_state: LatentState, stepper: DiffusionStepProtocol
        ) -> tuple[LatentState, LatentState]:
            return euler_denoising_loop(
                sigmas=sigmas,
                video_state=video_state,
                audio_state=audio_state,
                stepper=stepper,
                denoise_fn=simple_denoising_func(
                    video_context=video_context,
                    audio_context=audio_context,
                    transformer=transformer,
                ),
            )

        stage_1_output_shape = VideoPixelShape(
            batch=1, frames=num_frames, width=width // 2, height=height // 2, fps=frame_rate,
        )
        stage_1_conditionings = combined_image_conditionings(
            images=images, height=stage_1_output_shape.height, width=stage_1_output_shape.width,
            video_encoder=video_encoder, dtype=dtype, device=self.device,
        )

        video_state, audio_state = denoise_audio_video(
            output_shape=stage_1_output_shape, conditionings=stage_1_conditionings,
            noiser=noiser, sigmas=stage_1_sigmas, stepper=stepper, denoising_loop_fn=denoising_loop,
            components=self.pipeline_components, dtype=dtype, device=self.device,
        )

        if self._upsampler is None:
            self._upsampler = self.model_ledger.spatial_upsampler()
            
        upscaled_video_latent = upsample_video(
            latent=video_state.latent[:1], video_encoder=video_encoder, upsampler=self._upsampler
        )

        # Removed Stage 1 cleanup for Blackwell

        stage_2_sigmas = torch.Tensor(STAGE_2_DISTILLED_SIGMA_VALUES).to(self.device)
        stage_2_output_shape = VideoPixelShape(batch=1, frames=num_frames, width=width, height=height, fps=frame_rate)
        stage_2_conditionings = combined_image_conditionings(
            images=images, height=stage_2_output_shape.height, width=stage_2_output_shape.width,
            video_encoder=video_encoder, dtype=dtype, device=self.device,
        )
        video_state, audio_state = denoise_audio_video(
            output_shape=stage_2_output_shape, conditionings=stage_2_conditionings,
            noiser=noiser, sigmas=stage_2_sigmas, stepper=stepper, denoising_loop_fn=denoising_loop,
            components=self.pipeline_components, dtype=dtype, device=self.device,
            noise_scale=stage_2_sigmas[0], initial_video_latent=upscaled_video_latent,
            initial_audio_latent=audio_state.latent,
        )

        # Removed final cleanup for Blackwell

        if self._vae_decoder is None:
            self._vae_decoder = self.model_ledger.video_decoder()
        if self._audio_decoder is None:
            self._audio_decoder = self.model_ledger.audio_decoder()
        if self._vocoder is None:
            self._vocoder = self.model_ledger.vocoder()

        decoded_video = vae_decode_video(
            video_state.latent, self._vae_decoder, tiling_config, generator
        )
        decoded_audio = vae_decode_audio(
            audio_state.latent, self._audio_decoder, self._vocoder
        )
        return decoded_video, decoded_audio



# ---------------------------------------------------------------------------
#  Global pipeline holder
# ---------------------------------------------------------------------------
_pipeline: BlackwellDistilledPipeline | None = None
_pipeline_config: dict = {}


def _build_pipeline(
    checkpoint: str,
    upsampler: str,
    gemma: str,
    quantization: str = "none",
    lora_path: str = "",
    lora_strength: float = 1.0,
) -> BlackwellDistilledPipeline:
    """Build (or reuse) the global BlackwellDistilledPipeline instance."""
    global _pipeline, _pipeline_config

    config = dict(
        checkpoint=checkpoint,
        upsampler=upsampler,
        gemma=gemma,
        quantization=quantization,
        lora_path=lora_path,
        lora_strength=lora_strength,
    )
    if _pipeline is not None and _pipeline_config == config:
        logger.info("Reusing existing pipeline instance.")
        return _pipeline

    logger.info("Building new DistilledPipeline …")

    # Quantization
    quant_policy = None
    if quantization == "fp8-cast":
        quant_policy = QuantizationPolicy.fp8_cast()
    elif quantization == "fp8-scaled-mm":
        quant_policy = QuantizationPolicy.fp8_scaled_mm()

    # LoRA
    loras: list[LoraPathStrengthAndSDOps] = []
    if lora_path and Path(lora_path).is_file():
        loras.append(
            LoraPathStrengthAndSDOps(
                path=str(Path(lora_path).resolve()),
                strength=lora_strength,
                sd_ops=LTXV_LORA_COMFY_RENAMING_MAP,
            )
        )

    _pipeline = BlackwellDistilledPipeline(
        distilled_checkpoint_path=str(Path(checkpoint).resolve()),
        spatial_upsampler_path=str(Path(upsampler).resolve()),
        gemma_root=str(Path(gemma).resolve()),
        loras=loras,
        quantization=quant_policy,
    )
    _pipeline_config = config
    logger.info("Pipeline ready.")
    return _pipeline


# ---------------------------------------------------------------------------
#  Generation function
# ---------------------------------------------------------------------------
@torch.inference_mode()
def generate_video(
    prompt: str,
    seed: int,
    resolution_preset: str,
    custom_height: int,
    custom_width: int,
    use_custom_resolution: bool,
    num_frames: int,
    frame_rate: float,
    image_path: str | None,
    image_strength: float,
    image_crf: int,
    enhance_prompt: bool,
    progress: gr.Progress = gr.Progress(),
) -> tuple[str | None, str]:
    """Generate a video using the Distilled pipeline.
    Returns (output_video_path, status_message).
    """
    if _pipeline is None:
        return None, "❌ Pipeline not loaded. Configure model paths in the Settings tab first."

    # Resolve resolution
    if use_custom_resolution:
        height, width = int(custom_height), int(custom_width)
    else:
        height, width = PRESET_RESOLUTIONS.get(resolution_preset, (1024, 1536))

    # Validate resolution
    if height % 64 != 0 or width % 64 != 0:
        return None, f"❌ Resolution {height}×{width} must be divisible by 64."

    # Validate frames
    num_frames = int(num_frames)
    if (num_frames - 1) % 8 != 0:
        snapped = ((num_frames - 1) // 8) * 8 + 1
        return None, f"❌ Frame count must satisfy 8k+1. Try {snapped} instead of {num_frames}."

    # Build image conditionings
    images: list[ImageConditioningInput] = []
    if image_path and Path(image_path).is_file():
        images.append(
            ImageConditioningInput(
                path=str(Path(image_path).resolve()),
                frame_idx=0,
                strength=float(image_strength),
                crf=int(image_crf),
            )
        )

    seed = int(seed)
    if seed < 0:
        seed = torch.randint(0, 2**31, (1,)).item()

    # Estimate duration
    duration_sec = num_frames / frame_rate
    progress(0.0, desc="Initialising generation…")

    # Reset peak memory stats to track this specific generation
    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()

    t0 = time.perf_counter()
    status_parts = [
        f"🎬 {height}×{width} · {num_frames} frames · {frame_rate} fps · ~{duration_sec:.1f}s video",
        f"🎲 Seed: {seed}",
    ]
    if images:
        status_parts.append(f"🖼️ Image conditioning: strength={image_strength}")

    try:
        progress(0.05, desc="Waiting for CPU/Gemma slot…")
        with CPU_LOCK:
            progress(0.1, desc="Encoding prompt & building latents…")
            tiling_config = TilingConfig.default()
            video_chunks_number = get_video_chunks_number(num_frames, tiling_config)

            video, audio = _pipeline(
                prompt=prompt,
                seed=seed,
                height=height,
                width=width,
                num_frames=num_frames,
                frame_rate=frame_rate,
                images=images,
                tiling_config=tiling_config,
                enhance_prompt=enhance_prompt,
            )

        progress(0.85, desc="Encoding Video…")

        output_path = str(OUTPUT_DIR / f"ltx2_{uuid.uuid4().hex[:8]}.mp4")
        
        from ltx_pipelines.utils.media_io import encode_video
        encode_video(
            video=video,
            fps=int(frame_rate),
            audio=audio,
            output_path=output_path,
            video_chunks_number=video_chunks_number,
        )

        elapsed = time.perf_counter() - t0
        status_parts.append(f"⏱️ Done in {elapsed:.1f}s | Blackwell Optimized")
        
        if torch.cuda.is_available():
            peak_vram = torch.cuda.max_memory_allocated() / (1024**3)
            status_parts.append(f"📟 Peak VRAM: {peak_vram:.2f} GB")

        status_parts.append(f"✅ Saved to: {output_path}")

        progress(1.0, desc="Done!")
        return output_path, "\n".join(status_parts)

    except Exception as e:
        logger.exception("Generation failed")
        return None, f"❌ Generation failed: {e}"


# ---------------------------------------------------------------------------
#  Load pipeline from Settings tab
# ---------------------------------------------------------------------------
def load_pipeline_from_settings(
    checkpoint: str,
    upsampler: str,
    gemma: str,
    quantization: str,
    lora_path: str,
    lora_strength: float,
    progress: gr.Progress = gr.Progress(),
) -> str:
    """Load the pipeline with the given settings. Returns a status string."""
    progress(0.1, desc="Validating model paths…")
    # Validate paths
    if not checkpoint or not Path(checkpoint).is_file():
        return "❌ Distilled checkpoint path is invalid or file not found."
    if not upsampler or not Path(upsampler).is_file():
        return "❌ Spatial upsampler path is invalid or file not found."
    if not gemma or not Path(gemma).is_dir():
        return "❌ Gemma root path is invalid or directory not found."

    try:
        progress(0.3, desc="Loading Distilled Pipeline (this may take a minute)…")
        _build_pipeline(
            checkpoint=checkpoint,
            upsampler=upsampler,
            gemma=gemma,
            quantization=quantization,
            lora_path=lora_path or "",
            lora_strength=lora_strength,
        )
        progress(1.0, desc="Done!")
        return "✅ Pipeline loaded successfully! Switch to the Generate tab."
    except Exception as e:
        logger.exception("Failed to load pipeline")
        return f"❌ Failed to load pipeline: {e}"


# ---------------------------------------------------------------------------
#  Gradio UI
# ---------------------------------------------------------------------------
CSS = """
/* ── Base & Typography ─────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }

.gradio-container {
    max-width: 100% !important;
    padding: 0 24px !important;
    margin: 0 auto !important;
}

/* ── Header ────────────────────────────────────────────────── */
#app-header {
    text-align: center;
    padding: 32px 24px 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);
    margin-bottom: 20px;
    border: 1px solid rgba(139, 92, 246, 0.2);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}
#app-header h1 {
    margin: 0 0 6px;
    font-size: 2.2rem;
    font-weight: 700;
    background: linear-gradient(90deg, #c4b5fd, #93c5fd, #6ee7b7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}
#app-header p {
    margin: 0;
    color: rgba(255,255,255,0.65);
    font-size: 0.95rem;
    font-weight: 400;
}

/* ── Badge chips ───────────────────────────────────────────── */
.badge-row {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
}
.badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.2px;
}
.badge-purple {
    background: rgba(167,139,250,0.18);
    color: #c4b5fd;
    border: 1px solid rgba(167,139,250,0.3);
}
.badge-blue {
    background: rgba(96,165,250,0.18);
    color: #93c5fd;
    border: 1px solid rgba(96,165,250,0.3);
}
.badge-green {
    background: rgba(52,211,153,0.18);
    color: #6ee7b7;
    border: 1px solid rgba(52,211,153,0.3);
}
.badge-amber {
    background: rgba(251,191,36,0.18);
    color: #fde68a;
    border: 1px solid rgba(251,191,36,0.3);
}

/* ── Section headers ───────────────────────────────────────── */
.section-header {
    font-size: 1rem;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 8px;
}

/* ── Generate button ───────────────────────────────────────── */
#generate-btn {
    background: linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 14px 0 !important;
    font-size: 1.05rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.3px !important;
    color: #fff !important;
    box-shadow: 0 4px 20px rgba(99,102,241,0.25) !important;
    transition: all 0.25s ease !important;
    cursor: pointer !important;
}
#generate-btn:hover {
    box-shadow: 0 6px 28px rgba(99,102,241,0.4) !important;
    transform: translateY(-1px) !important;
}

/* ── Load button ───────────────────────────────────────────── */
#load-btn {
    background: linear-gradient(135deg, #059669, #10b981) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 14px 0 !important;
    font-size: 1.05rem !important;
    font-weight: 600 !important;
    color: #fff !important;
    box-shadow: 0 4px 20px rgba(16,185,129,0.2) !important;
}
#load-btn:hover {
    box-shadow: 0 6px 28px rgba(16,185,129,0.35) !important;
}

/* ── Status box ────────────────────────────────────────────── */
#status-box textarea, #settings-status textarea {
    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
    font-size: 0.85rem !important;
    line-height: 1.6 !important;
}

/* ── Video output container ────────────────────────────────── */
#video-output {
    border-radius: 12px !important;
    overflow: hidden !important;
}

/* ── Tab styling ───────────────────────────────────────────── */
.tabs > .tab-nav > button {
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    padding: 10px 24px !important;
}

/* ── Resolution tip ────────────────────────────────────────── */
.resolution-info {
    font-size: 0.82rem;
    opacity: 0.6;
    margin-top: 4px;
}
"""

HEADER_HTML = """
<div id="app-header">
    <h1>⚡ LTX-2 Video Studio</h1>
    <p>Distilled Pipeline · Fast Audio-Video Generation</p>
    <div class="badge-row">
        <span class="badge badge-purple">🧠 Distilled Model</span>
        <span class="badge badge-blue">🎬 8+4 Step Generation</span>
        <span class="badge badge-green">🔊 Joint Audio-Video</span>
        <span class="badge badge-amber">⚡ FP8 Quantisation Support</span>
    </div>
</div>
"""


def build_ui(args: argparse.Namespace) -> gr.Blocks:
    """Build the Gradio Blocks UI."""

    theme = gr.themes.Soft(
        primary_hue=gr.themes.colors.violet,
        secondary_hue=gr.themes.colors.blue,
        neutral_hue=gr.themes.colors.slate,
        font=gr.themes.GoogleFont("Inter"),
    )

    with gr.Blocks(
        css=CSS,
        title="LTX-2 Video Studio",
        theme=theme,
    ) as app:
        gr.HTML(HEADER_HTML)

        with gr.Tabs():
            # ────────────────── GENERATE TAB ──────────────────
            with gr.Tab("🎬 Generate", id="generate-tab"):
                with gr.Row(equal_height=False):
                    # LEFT COLUMN — Controls
                    with gr.Column(scale=5):
                        # Prompt section
                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 💬 Prompt")
                            prompt = gr.Textbox(
                                label="Video Description",
                                placeholder="Describe the video you want to generate…",
                                value=DEFAULT_PROMPT,
                                lines=4,
                                max_lines=8,
                            )
                            enhance_prompt = gr.Checkbox(
                                label="✨ Enhance prompt with AI",
                                value=False,
                                info="Uses the text encoder to refine and expand your prompt",
                            )

                        # Video settings
                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 🎥 Video Settings")
                            with gr.Row():
                                resolution_preset = gr.Dropdown(
                                    choices=list(PRESET_RESOLUTIONS.keys()),
                                    value="1280 × 768   (720p Landscape)",
                                    label="Resolution Preset",
                                    interactive=True,
                                )
                                seed = gr.Number(
                                    label="Seed",
                                    value=42,
                                    precision=0,
                                    minimum=-1,
                                    info="-1 for random",
                                )

                            use_custom_res = gr.Checkbox(
                                label="Use custom resolution",
                                value=False,
                            )
                            with gr.Row(visible=False) as custom_res_row:
                                custom_height = gr.Number(label="Height", value=1024, precision=0, minimum=64, maximum=2160)
                                custom_width = gr.Number(label="Width", value=1536, precision=0, minimum=64, maximum=3840)
                            gr.Markdown(
                                "<span class='resolution-info'>Tip: Height & width must be divisible by 64. "
                                "Frames must be 8k+1 (e.g. 9, 17, 25, …, 97, 121).</span>"
                            )

                            use_custom_res.change(
                                fn=lambda x: gr.update(visible=x),
                                inputs=use_custom_res,
                                outputs=custom_res_row,
                            )

                            with gr.Row():
                                num_frames = gr.Slider(
                                    label="Frame Count",
                                    minimum=9,
                                    maximum=257,
                                    step=8,
                                    value=121,
                                    info="8k+1 format (121 = 5s @ 24fps)",
                                )
                                frame_rate = gr.Slider(
                                    label="Frame Rate (fps)",
                                    minimum=8,
                                    maximum=30,
                                    step=1,
                                    value=24,
                                )

                        # Image conditioning
                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 🖼️ Image Conditioning  *(optional)*")
                            image_input = gr.Image(
                                label="Conditioning Image",
                                type="filepath",
                                height=200,
                            )
                            with gr.Row():
                                image_strength = gr.Slider(
                                    label="Strength",
                                    minimum=0.0,
                                    maximum=1.0,
                                    step=0.05,
                                    value=1.0,
                                    info="How strongly the image influences frame 0",
                                )
                                image_crf = gr.Slider(
                                    label="CRF (Compression)",
                                    minimum=0,
                                    maximum=51,
                                    step=1,
                                    value=DEFAULT_IMAGE_CRF,
                                    info="0 = lossless, 33 = default",
                                )

                        # Generate
                        generate_btn = gr.Button(
                            "⚡ Generate Video",
                            variant="primary",
                            elem_id="generate-btn",
                            size="lg",
                        )

                    # RIGHT COLUMN — Output
                    with gr.Column(scale=6):
                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 🎞️ Output")
                            video_output = gr.Video(
                                label="Generated Video",
                                elem_id="video-output",
                                height=520,
                                autoplay=True,
                            )
                            status_output = gr.Textbox(
                                label="Status",
                                elem_id="status-box",
                                lines=5,
                                max_lines=8,
                                interactive=False,
                                value="Configure model paths in the ⚙️ Settings tab, then click Generate.",
                            )

                generate_btn.click(
                    fn=generate_video,
                    inputs=[
                        prompt,
                        seed,
                        resolution_preset,
                        custom_height,
                        custom_width,
                        use_custom_res,
                        num_frames,
                        frame_rate,
                        image_input,
                        image_strength,
                        image_crf,
                        enhance_prompt,
                    ],
                    outputs=[video_output, status_output],
                    concurrency_limit=MAX_CONCURRENT_GENS,
                )

            # ────────────────── SETTINGS TAB ──────────────────
            with gr.Tab("⚙️ Settings", id="settings-tab"):
                with gr.Row():
                    with gr.Column():
                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 📂 Model Paths")
                            gr.Markdown(
                                "*Point these to the local model files. All paths are required.*"
                            )
                            settings_checkpoint = gr.Textbox(
                                label="Distilled Checkpoint (.safetensors)",
                                value=args.distilled_checkpoint_path or "",
                                placeholder="/path/to/ltx-video-2b-v0.9.5-distilled.safetensors",
                            )
                            settings_upsampler = gr.Textbox(
                                label="Spatial Upsampler (.safetensors)",
                                value=args.spatial_upsampler_path or "",
                                placeholder="/path/to/spatial_upsampler.safetensors",
                            )
                            settings_gemma = gr.Textbox(
                                label="Gemma Root Directory",
                                value=args.gemma_root or "",
                                placeholder="/path/to/gemma",
                            )

                        with gr.Group(elem_classes=""):
                            gr.Markdown("### ⚡ Optimisation")
                            settings_quant = gr.Radio(
                                choices=["none", "fp8-cast", "fp8-scaled-mm"],
                                value="fp8-cast",
                                label="Quantisation Policy",
                                info="FP8 reduces VRAM usage. fp8-cast works on any FP8 GPU; fp8-scaled-mm needs Hopper+.",
                            )

                        with gr.Group(elem_classes=""):
                            gr.Markdown("### 🔗 LoRA  *(optional)*")
                            settings_lora_path = gr.Textbox(
                                label="LoRA Path (.safetensors)",
                                value="",
                                placeholder="/path/to/lora.safetensors (optional)",
                            )
                            settings_lora_strength = gr.Slider(
                                label="LoRA Strength",
                                minimum=0.0,
                                maximum=2.0,
                                step=0.05,
                                value=1.0,
                            )

                        load_btn = gr.Button(
                            "🚀 Load Pipeline",
                            variant="primary",
                            elem_id="load-btn",
                            size="lg",
                        )
                        settings_status = gr.Textbox(
                            label="Status",
                            elem_id="settings-status",
                            lines=3,
                            interactive=False,
                            value="Configure model paths above and click Load Pipeline.",
                        )

                        load_btn.click(
                            fn=load_pipeline_from_settings,
                            inputs=[
                                settings_checkpoint,
                                settings_upsampler,
                                settings_gemma,
                                settings_quant,
                                settings_lora_path,
                                settings_lora_strength,
                            ],
                            outputs=settings_status,
                        )

                    # Right column — info panel
                    with gr.Column():
                        with gr.Group(elem_classes=""):
                            gr.Markdown("""### 📖 About the Distilled Pipeline

The **Distilled Pipeline** is the fastest LTX-2 inference mode:

| Stage | Steps | Resolution | Model |
|---|---|---|---|
| **Stage 1** | 8 fixed σ-steps | Half resolution | Distilled checkpoint |
| **Stage 2** | 4 fixed σ-steps | Full resolution | Distilled checkpoint |

**Key characteristics:**
- ⚡ **12 total denoising steps** (vs 30-44 for full model)
- 🚫 **No negative prompt** — quality is baked into the distilled weights
- 🎵 **Joint audio-video** generation with vocoder decoding
- 🖼️ **Image conditioning** at frame 0 (optional)

**Sigma schedule (Stage 1):**
```
[1.0, 0.994, 0.988, 0.981, 0.975, 0.909, 0.725, 0.422, 0.0]
```

**Sigma schedule (Stage 2):**
```
[0.909, 0.725, 0.422, 0.0]
```

**Required model files:**
1. **Distilled checkpoint** — the distilled `.safetensors` model
2. **Spatial upsampler** — 2× latent upscaler for Stage 2
3. **Gemma text encoder** — Google Gemma for prompt encoding

**Memory tips:**
- Set `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`
- Use FP8 quantisation to reduce VRAM by ~40%
- The pipeline automatically frees models between stages
""")

    # Auto-load if all paths provided via CLI
    if args.distilled_checkpoint_path and args.spatial_upsampler_path and args.gemma_root:
        try:
            _build_pipeline(
                checkpoint=args.distilled_checkpoint_path,
                upsampler=args.spatial_upsampler_path,
                gemma=args.gemma_root,
                quantization=args.quantization or "none",
            )
            logger.info("Pipeline auto-loaded from CLI arguments.")
        except Exception:
            logger.warning("Failed to auto-load pipeline from CLI args. Configure in Settings tab.")

    return app


# ---------------------------------------------------------------------------
#  Entrypoint
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="LTX-2 Distilled — Gradio Video Studio")
    parser.add_argument("--distilled-checkpoint-path", type=str, default=os.environ.get("LTX2_DISTILLED_CHECKPOINT", ""))
    parser.add_argument("--spatial-upsampler-path", type=str, default=os.environ.get("LTX2_SPATIAL_UPSAMPLER", ""))
    parser.add_argument("--gemma-root", type=str, default=os.environ.get("LTX2_GEMMA_ROOT", ""))
    parser.add_argument("--quantization", type=str, default="none", choices=["none", "fp8-cast", "fp8-scaled-mm"])
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=7860)
    parser.add_argument("--share", action="store_true", help="Create a public Gradio link")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    app = build_ui(args)
    app.launch(
        server_name=args.host,
        server_port=args.port,
        share=args.share,
        show_error=True,
        max_threads=10,
    )
