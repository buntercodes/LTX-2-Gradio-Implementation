"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, Settings2, Image as ImageIcon, Loader2, ChevronUp, ChevronDown, Dices } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerationFormProps {
    onTaskCreated: (taskId: string, prompt: string) => void;
    isPipelineLoaded: boolean;
    mode?: 'text' | 'image';
}

const RESOLUTION_PRESETS = [
    "1280 × 768   (720p Landscape)",
    "768 × 1280   (720p Portrait)",
    "1024 × 1024  (Square)",
    "1536 × 1024  (Ultrawide)",
]

export default function GenerationForm({ onTaskCreated, isPipelineLoaded, mode = 'text' }: GenerationFormProps) {
    const [prompt, setPrompt] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Advanced settings
    const [numFrames, setNumFrames] = useState(121)
    const [resolution, setResolution] = useState(RESOLUTION_PRESETS[0])
    const [seed, setSeed] = useState(-1)
    const [enhancePrompt, setEnhancePrompt] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt || isSubmitting || !isPipelineLoaded || (mode === 'image' && !image)) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    num_frames: numFrames,
                    resolution_preset: resolution,
                    seed,
                    enhance_prompt: enhancePrompt,
                    ...(mode === 'image' && imagePreview ? { image_base64: imagePreview } : {})
                }),
            })

            if (!response.ok) throw new Error('Failed to generate video')

            const data = await response.json()
            onTaskCreated(data.task_id, prompt)
            setPrompt('')
        } catch (error) {
            console.error(error)
            alert("Error generating video. Make sure the backend is running.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the cinematic masterpiece you want to create..."
                        className="w-full h-32 px-6 py-4 rounded-2xl glass-card text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-gray-500"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={!prompt || isSubmitting || !isPipelineLoaded || (mode === 'image' && !image)}
                            className="px-6 py-2 bg-gradient-premium rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {mode === 'image' && (
                    <div className="relative group">
                        <label className="block w-full cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview ? (
                                <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-white/10 group-hover:border-indigo-500/50 transition-all">
                                    <img src={imagePreview} alt="Source frame" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <p className="text-white font-bold flex items-center gap-2 text-sm">
                                            <ImageIcon className="w-4 h-4" />
                                            Change Image
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-24 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-row items-center justify-center gap-4 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group/drop cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover/drop:scale-110 transition-all">
                                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-gray-400 text-sm font-medium">Select Source Image</p>
                                    </div>
                                </div>
                            )}
                        </label>
                        {imagePreview && (
                            <button
                                type="button"
                                onClick={() => { setImage(null); setImagePreview(null); }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all z-10"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="pt-2">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-indigo-400" />
                        Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl glass-card p-6 border border-white/5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">Resolution Preset</label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {RESOLUTION_PRESETS.map(preset => (
                                    <option key={preset} value={preset}>{preset}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">Number of Frames (9 to 721)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={numFrames}
                                    readOnly
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-default [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute right-1 top-1 bottom-1 flex flex-col gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setNumFrames(prev => Math.min(721, prev + 8))}
                                        className="flex-1 px-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNumFrames(prev => Math.max(9, prev - 8))}
                                        className="flex-1 px-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">Random Seed (-1 for random)</label>
                            <div className="relative group/seed">
                                <input
                                    type="number"
                                    value={seed}
                                    min={-1}
                                    onChange={(e) => setSeed(parseInt(e.target.value))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-16 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setSeed(-1)}
                                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-indigo-400 transition-all"
                                        title="Set to Random (-1)"
                                    >
                                        <Dices className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="flex flex-col gap-0.5 h-full">
                                        <button
                                            type="button"
                                            onClick={() => setSeed(prev => prev + 1)}
                                            className="flex-1 px-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                        >
                                            <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSeed(prev => Math.max(-1, prev - 1))}
                                            className="flex-1 px-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                        >
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="enhance"
                                checked={enhancePrompt}
                                onChange={(e) => setEnhancePrompt(e.target.checked)}
                                className="w-4 h-4 rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <label htmlFor="enhance" className="text-sm font-semibold text-gray-400">Enhance Prompt (AI)</label>
                        </div>
                    </div>
                </div>
            </form>
            {!isPipelineLoaded && (
                <p className="text-center mt-4 text-red-400 text-sm animate-pulse">
                    ⚠️ Pipeline is not loaded. Please initialize the system first.
                </p>
            )}
        </motion.div>
    )
}
