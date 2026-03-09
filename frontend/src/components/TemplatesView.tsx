"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Play, Copy, Heart, User } from 'lucide-react'

const TEMPLATES = [
    {
        title: "Cinematic Neo-Tokyo",
        prompt: "A neon-drenched cyberpunk city street, futuristic cars floating, hyper-realistic reflections in puddles, 8k cinematic lighting.",
        author: "CyberpunkArt",
        likes: 1240,
        category: "Futuristic"
    },
    {
        title: "Ancient Forest Spirit",
        prompt: "Deep ancient forest with glowing ethereal spirits moving through trees, mossy ground, sun rays piercing through canopy, Studio Ghibli style.",
        author: "NatureLover",
        likes: 852,
        category: "Fantasy"
    },
    {
        title: "Minimalist Architectural Flow",
        prompt: "Bauhaus style building with soft shadows, abstract geometric shapes shifting, clean white surfaces, bright natural light.",
        author: "ArchViz",
        likes: 432,
        category: "Architecture"
    },
    {
        title: "Cosmic Voyage",
        prompt: "Space exploration, colorful nebula clusters, spaceship warping through stars, intense lens flares, interstellar scale.",
        author: "SpaceXFan",
        likes: 2105,
        category: "Sci-Fi"
    },
    {
        title: "Abstract Liquid Gold",
        prompt: "Molten gold flowing in zero gravity, complex ripples, high-end commercial aesthetic, macro photography style.",
        author: "MotionMaster",
        likes: 671,
        category: "Abstract"
    },
    {
        title: "Retro 80s Sunset",
        prompt: "Grid floor stretching to infinity, low poly mountains, giant pink sun, VHS glitch aesthetic, synthwave colors.",
        author: "RetroWave",
        likes: 1590,
        category: "Artistic"
    }
]

export default function TemplatesView() {
    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Prompt Library</h1>
                <p className="text-gray-400">Discover and fork community-proven cinematic templates.</p>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {['All Templates', 'Cinematic', 'Fantasy', 'Sci-Fi', 'Abstract', 'Realism', 'Anime'].map((cat, i) => (
                    <button
                        key={cat}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${i === 0 ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {TEMPLATES.map((tmpl, i) => (
                    <motion.div
                        key={tmpl.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative rounded-[2.5rem] glass-card border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all cursor-pointer"
                    >
                        <div className="aspect-[4/3] bg-gradient-to-br from-slate-800 to-black relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-10">
                                <div className="p-4 rounded-full bg-white/20 border border-white/20 hover:scale-110 transition-transform">
                                    <Play className="w-8 h-8 fill-white text-white" />
                                </div>
                            </div>
                            <div className="absolute top-4 left-4 z-20">
                                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-white/10">
                                    {tmpl.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{tmpl.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 italic">"{tmpl.prompt}"</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                                    <span className="text-xs font-bold text-gray-400">{tmpl.author}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <Heart className="w-4 h-4" />
                                        <span className="text-xs font-bold">{tmpl.likes}</span>
                                    </div>
                                    <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-400 transition-all">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <button className="px-12 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all text-gray-400">
                    Load More Templates
                </button>
            </div>
        </div>
    )
}
