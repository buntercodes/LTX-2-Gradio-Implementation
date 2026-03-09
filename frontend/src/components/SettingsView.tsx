"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Cpu, Shield, Globe, Bell } from 'lucide-react'
import SystemLoader from '@/components/SystemLoader'

interface SettingsViewProps {
    isPipelineLoaded: boolean;
    onPipelineLoaded: () => void;
}

export default function SettingsView({ isPipelineLoaded, onPipelineLoaded }: SettingsViewProps) {
    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-gradient">System Settings</h1>
                <p className="text-gray-400">Manage your local LTX-2.3 configuration, hardware optimization, and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Controls */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl w-fit">
                            <Cpu className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Engine Initialization</span>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <SystemLoader
                                isLoaded={isPipelineLoaded}
                                onLoaded={onPipelineLoaded}
                            />
                        </div>
                    </section>

                    <section className="p-8 rounded-[2.5rem] glass-card border border-white/5 space-y-6 opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-bold">API & Security</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold">System API Access</p>
                                    <p className="text-xs text-gray-500">Enable external control of generation queue.</p>
                                </div>
                                <div className="w-10 h-6 bg-slate-800 rounded-full relative">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-gray-600 rounded-full shadow-lg" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Info/Quick Links */}
                <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] glass-card border border-white/5 space-y-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" /> Environment
                        </h3>
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between font-mono">
                                <span className="text-gray-500">Backend URL:</span>
                                <span className="text-indigo-400 truncate ml-4 font-bold">{process.env.NEXT_PUBLIC_API_URL || 'Not Set'}</span>
                            </div>
                            <div className="flex justify-between font-mono">
                                <span className="text-gray-500">Mode:</span>
                                <span className="text-indigo-400 font-bold uppercase">Development</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                            <Bell className="w-4 h-4" /> Notifications
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            Currently, system alerts are displayed live in the top status bar. Feature-specific toast notifications are coming in v2.4.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
