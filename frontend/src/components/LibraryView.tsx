"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Video, Sparkles, LayoutGrid, Search, Filter, SortAsc } from 'lucide-react'
import GenerationForm from '@/components/GenerationForm'
import VideoCard from '@/components/VideoCard'
import SystemLoader from '@/components/SystemLoader'

interface StudioViewProps {
    tasks: string[];
    isPipelineLoaded: boolean;
    onTaskCreated: (taskId: string) => void;
    onRemoveTask: (taskId: string) => void;
}

export default function LibraryView({ tasks, onRemoveTask }: { tasks: string[], onRemoveTask: (id: string) => void }) {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Your Creations</h1>
                    <p className="text-gray-400">Manage and browse your generated cinematic assets.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search prompt..."
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
                        />
                    </div>
                    <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-500">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-500">
                        <SortAsc className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="w-full py-32 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center bg-white/[0.01]">
                    <div className="bg-indigo-500/10 p-6 rounded-full mb-6">
                        <Video className="w-12 h-12 text-indigo-500/50" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-300">Start your first production</h3>
                    <p className="text-gray-500 max-w-sm mt-4 text-lg">
                        Your asset library is currently empty. Head over to the Studio and bring your ideas to life.
                    </p>
                    <button className="mt-8 px-10 py-4 bg-gradient-premium rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.05] transition-all">
                        Open Studio
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {tasks.map(id => (
                        <VideoCard
                            key={id}
                            taskId={id}
                            onRemove={onRemoveTask}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
