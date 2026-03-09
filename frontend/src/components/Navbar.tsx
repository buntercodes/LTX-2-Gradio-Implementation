"use client"

import React from 'react'
import { Cpu, Github } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-16 flex items-center px-6 md:px-12 justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Cpu className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gradient">LTX-2.3 Studio</span>
            </div>

            <div className="flex items-center gap-6">
                <Link href="/" className="text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
                <Link
                    href="https://github.com/buntercodes/LTX-2-Gradio-Implementation"
                    target="_blank"
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    <Github className="w-5 h-5" />
                </Link>
            </div>
        </nav>
    )
}
