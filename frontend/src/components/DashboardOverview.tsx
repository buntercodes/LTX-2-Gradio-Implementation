"use client"

import React from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    Video,
    Cpu,
    Zap,
    ArrowUpRight,
    Server,
    ShieldCheck
} from 'lucide-react'

interface DashboardOverviewProps {
    activeTasks: number;
}

export default function DashboardOverview({ activeTasks }: DashboardOverviewProps) {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-gradient">System Overview</h1>
                <p className="text-gray-400">Real-time status of your local LTX-2.3 high-performance pipeline.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Tasks Stat */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2.5rem] glass-card border border-white/5 space-y-6 group hover:border-indigo-500/20 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            Live
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Queue</p>
                        <p className="text-5xl font-black tracking-tight">{activeTasks}</p>
                        <p className="text-xs text-gray-400 pt-2 flex items-center gap-1">
                            <Server className="w-3 h-3" /> Processing Tasks
                        </p>
                    </div>
                </motion.div>

                {/* GPU Capability Stat */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 rounded-[2.5rem] glass-card border border-white/5 space-y-6 group hover:border-purple-500/20 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-4 bg-purple-500/10 rounded-2xl">
                            <Cpu className="w-6 h-6 text-purple-400" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-gray-700 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Hardware Target</p>
                        <p className="text-3xl font-black tracking-tight">RTX Pro 6000</p>
                        <p className="text-xs text-purple-400 pt-2 flex items-center gap-1 font-bold italic">
                            Blackwell B200 Optimized
                        </p>
                    </div>
                </motion.div>

                {/* Engine Stat */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-[2.5rem] glass-card border border-white/5 space-y-6 group hover:border-emerald-500/20 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pipeline Version</p>
                        <p className="text-3xl font-black tracking-tight">LTX-2.3 v1.0</p>
                        <p className="text-xs text-emerald-500/70 pt-2 flex items-center gap-1 font-bold">
                            Stable Distilled weights
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 max-w-xl text-center md:text-left">
                        <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl w-fit mx-auto md:mx-0">
                            <Zap className="w-8 h-8 text-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.3)]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black tracking-tight leading-tight">Ready to generate cinematic history?</h2>
                            <p className="text-gray-400 text-lg font-medium leading-relaxed">
                                Your local workstation is optimized for high-throughput video distillation. Start a new production in the Creative Studio.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.hash = 'studio'}
                        className="px-12 py-6 bg-gradient-premium rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-4 group"
                    >
                        <Video className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Start Production
                    </button>
                </div>
            </div>
        </div>
    )
}
