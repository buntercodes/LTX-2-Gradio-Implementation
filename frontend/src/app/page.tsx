"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Video,
  Cpu,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  Shield,
  Loader2
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

export default function LandingPage() {
  const { user, loginWithGoogle, isLoggingIn } = useAuth()

  return (
    <div className="h-screen bg-[#020617] text-white overflow-hidden relative flex flex-col selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="w-full h-20 flex items-center justify-between px-8 border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase italic">LTX Studio</span>
        </div>

        {user ? (
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Launch Studio
          </Link>
        ) : (
          <button
            onClick={() => loginWithGoogle()}
            disabled={isLoggingIn}
            className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
        )}
      </nav>

      {/* Main Content - Flex-grow to fill screen */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative max-h-[calc(100vh-140px)]">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Hero Copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Sparkles className="w-3 h-3" />
              Blackwell Optimized v2.3
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] italic"
            >
              Imagine. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Generate.
              </span> <br />
              Succeed.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg font-medium leading-relaxed max-w-md"
            >
              Professional-grade text-to-video synthesis powered by local Blackwell clusters. Cinema at your fingertips.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4"
            >
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-white shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all group"
                >
                  Launch Studio
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => loginWithGoogle()}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-white shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Sign In with Google
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Visual Preview / Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="glass-card border border-white/10 rounded-[3rem] p-8 aspect-square flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -z-10" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight">LTX-2 Native</h3>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Hardware Acceleration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Zap, label: "Latency", val: "0.4s / step" },
                  { icon: Shield, label: "Bitrate", val: "High Fidelity" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-sm font-black">{stat.val}</span>
                  </div>
                ))}
              </div>

              <div className="h-24 w-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-2xl border border-white/5 flex items-center justify-center">
                <Video className="w-8 h-8 text-indigo-400/50" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Simplified Footer - Fixed at bottom */}
      <footer className="h-16 border-t border-white/5 flex items-center justify-between px-10 opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">
        <span>Optimized for Pro 6000 Ada</span>
        <div className="flex gap-6">
          <span>Enterprise Secure</span>
          <span>© 2026 LTX Studio</span>
        </div>
      </footer>
    </div>
  )
}
