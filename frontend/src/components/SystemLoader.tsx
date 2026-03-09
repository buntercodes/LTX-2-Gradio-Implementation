"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Settings, Terminal, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SystemLoaderProps {
    isLoaded: boolean;
    onLoaded: () => void;
}

export default function SystemLoader({ isLoaded, onLoaded }: SystemLoaderProps) {
    const [isInitializing, setIsInitializing] = useState(false)
    const [quantization, setQuantization] = useState('none')
    const [status, setStatus] = useState('')

    const handleInit = async () => {
        setIsInitializing(true)
        setStatus('Initializing LTX-2.3 Pipeline...')

        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/system/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantization }),
            })

            if (!resp.ok) throw new Error('Failed to load system')

            const data = await resp.json()
            setStatus(data.message)
            if (data.pipeline_loaded) {
                setTimeout(() => onLoaded(), 1500)
            }
        } catch (err) {
            console.error(err)
            setStatus('Failed to initialize system. Please check backend logs.')
        } finally {
            setIsInitializing(false)
        }
    }

    return (
        <div className="w-full p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
                        System Initialization
                        {isLoaded && <CheckCircle2 className="w-6 h-6 text-green-400" />}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Configure and initialize the LTX-2.3 high-performance pipeline.
                    </p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Settings className="w-6 h-6 text-indigo-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quantization Mode</label>
                    <select
                        disabled={isLoaded}
                        value={quantization}
                        onChange={(e) => setQuantization(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-slate-900 transition-all cursor-pointer"
                    >
                        <option value="none">None (BF16)</option>
                        <option value="fp8-cast">FP8 Cast (Memory Efficient)</option>
                        <option value="fp8-scaled-mm">FP8 Scaled MM (Fastest)</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleInit}
                        disabled={isInitializing || isLoaded}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                            isLoaded
                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                : "bg-gradient-premium hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
                        )}
                    >
                        {isInitializing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isLoaded ? (
                            <>Done Ready</>
                        ) : (
                            <>Initialize Pipeline</>
                        )}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs flex items-start gap-3"
                    >
                        <Terminal className="w-4 h-4 text-gray-600 mt-1 shrink-0" />
                        <span className="text-gray-400">{status}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
