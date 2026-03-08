# <p align="center">� LTX-2.3 | Linux Blackwell Deployment Guide</p>
<p align="center"><i>Easy Setup for NVIDIA RTX PRO 6000 (96GB VRAM) on Linux Server</i></p>

---

<p align="center">
  <img src="https://img.shields.io/badge/LTX--2.3-Latest-blueviolet?style=for-the-badge" alt="LTX-2.3">
  <img src="https://img.shields.io/badge/OS-Ubuntu_/_Linux-E94333?style=for-the-badge" alt="Linux">
  <img src="https://img.shields.io/badge/Hardware-NVIDIA_Blackwell-76B900?style=for-the-badge" alt="Blackwell">
  <img src="https://img.shields.io/badge/VRAM-96GB-orange?style=for-the-badge" alt="96GB VRAM">
</p>

---

## � Welcome! 
This guide is designed to help anyone—even if you're new to Linux—get the **LTX-2.3 FastAPI Server** running on your **Blackwell 96GB** instance in just a few minutes.

---

## 🏗️ Step 0: Get the Code
The very first step is to bring this high-performance project onto your Linux server.

1. **Open your terminal**.
2. **Clone the repository**:
   ```bash
   git clone https://github.com/buntercodes/LTX-2-Gradio-Implementation.git
   ```
3. **Enter the folder**:
   ```bash
   cd LTX-2-Gradio-Implementation
   ```
   *Note: Using the specialized LTX-2.3 implementation for the dedicated FastAPI server.*

---

## 🛠️ Step 1: Prepare the System
Run these commands one by one to install the necessary tools.

### 1.1 Install Python & GPU Tools
```bash
# Update your system packages
sudo apt update && sudo apt upgrade -y

# Install Python and essential build tools
sudo apt install -y python3-pip python3-venv git
```

### 1.2 Install 'uv' (Fastest Package Manager)
We use `uv` because it installs everything 10x faster than normal.
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/env
```

---

## 📦 Step 1.5: Build the Environment
This step installs the exact same software versions used by the original LTX 2.3 team.

```bash
# Install all "hidden" requirements (like Torch & Transformers)
uv sync --frozen

# Activate the local virtual environment
source .venv/bin/activate
```

---

## 🔑 Step 2: Access the Model
The **Gemma 3** model is "gated" by Google. You need to tell the server who you are.

1. **Accept Terms**: Go to [Hugging Face Gemma 3](https://huggingface.co/google/gemma-3-12b-it-qat-q4_0-unquantized) and click "Accept".
2. **Get your Token**: Go to [HF Tokens](https://huggingface.co/settings/tokens) and copy your "Write" token.
3. **Set it on your server**:
   ```bash
   export HF_TOKEN="your_token_here"
   ```

---

## ⚙️ Step 3: Configure for Blackwell (96GB VRAM)
Copy and paste these lines into your terminal to unlock the power of your **Blackwell GPU**.

```bash
# Optimize for your 96GB VRAM
export LTX23_QUANTIZATION="fp8-cast"
export MAX_CONCURRENT_GENS="6"
export MAX_CPU_TASKS="2"

# Speed up memory allocation on Linux
export PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"
```

---

## 🚀 Step 4: Launch the Server
This single command handles everything: it downloads the models (~45GB) and starts the API.

```bash
uv run uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## � Step 5: Is it working?
Once you see `Uvicorn running on http://0.0.0.0:8000`, the server is ready!

### How to test:
Open your browser (from your local computer) and go to:
👉 **`http://your-server-ip:8000/docs`**
*(Replace `your-server-ip` with the IP address of your Linux instance.)*

---

## 💎 Pro Tips for Beginners
- **Screen/Tmux**: If you want the server to keep running after you close your terminal, use a tool like `screen` or `tmux`.
- **Disk Space**: You need about **100GB** of free disk space for the models and videos.
- **VRAM**: Since you have 96GB, you can generate 1080p videos without worrying about crashes!

---

<p align="center">
  <b>Simple • Fast • Powerful</b>
</p>
