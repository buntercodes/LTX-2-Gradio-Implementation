"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import {
    Cpu,
    ArrowRight,
    Sparkles,
    Globe,
    Shield
} from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
    const { loginWithGoogle } = useAuth()

    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-indigo-500/30">
            {/* Background elements */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/10 blur-[150px] rounded-full" />
                <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10 space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Cpu className="text-white w-8 h-8" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter uppercase italic">LTX Studio</span>
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight mt-6">Secure Access.</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Enterprise Identity Management</p>
                </div>

                <div className="glass-card border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-12 h-12 text-indigo-400" />
                    </div>

                    <div className="relative z-10 space-y-8 py-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold italic">Authorized SSO Only</h2>
                            <p className="text-gray-500 text-sm leading-relaxed px-4">
                                LTX Studio uses centralized OAuth 2.0 verification for all Blackwell cluster sessions.
                            </p>
                        </div>

                        <button
                            onClick={() => loginWithGoogle()}
                            className="w-full h-16 bg-white text-black rounded-2xl font-black shadow-2xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="pt-4 flex items-center justify-center gap-6 opacity-40 grayscale">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Global SSO</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-10 text-sm text-gray-500 font-medium">
                    Hardware node: <span className="text-indigo-400 font-bold tracking-widest">US-EAST-BWL-01</span> <br />
                    Access governed by Corporate Security Policy.
                </p>
            </motion.div>
        </div>
    )
}
