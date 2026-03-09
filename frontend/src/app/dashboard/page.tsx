"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import GenerationForm from '@/components/GenerationForm'
import SettingsView from '@/components/SettingsView'
import AccountMenu from '@/components/AccountMenu'
import VideoPlayer from '@/components/VideoPlayer'
import { Bell, Layers, Loader2, Video, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface Task {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    thumbnailUrl?: string;
    prompt?: string;
    progress?: number;
}

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('studio')
    const [mode, setMode] = useState<'text' | 'image'>('text')
    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedVideo, setSelectedVideo] = useState<Task | null>(null)
    const [isPipelineLoaded, setIsPipelineLoaded] = useState(false)
    const [systemStats, setSystemStats] = useState({ active_tasks: 0 })

    const checkSystemStatus = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/system/status`)
            if (resp.ok) {
                const data = await resp.json()
                setIsPipelineLoaded(data.pipeline_loaded)
                setSystemStats({ active_tasks: data.active_tasks })
            }
        } catch (err) {
            console.error('Failed to link with backend:', err)
        }
    }

    const pollTaskStatus = async (taskId: string) => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${taskId}`)
            if (resp.ok) {
                const data = await resp.json()
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        const updated = {
                            ...t,
                            status: data.status,
                            videoUrl: data.video_url ? `${process.env.NEXT_PUBLIC_API_URL}${data.video_url}` : undefined,
                            progress: data.progress || 0
                        }
                        if (updated.status === 'completed' && (!selectedVideo || selectedVideo.id === taskId)) {
                            setSelectedVideo(updated)
                        }
                        return updated
                    }
                    return t
                }))
                if (data.status === 'completed' || data.status === 'failed') return true
            }
        } catch (err) {
            console.error('Polling error:', err)
        }
        return false
    }

    useEffect(() => {
        if (!authLoading && !user) router.push('/')
    }, [user, authLoading, router])

    useEffect(() => {
        checkSystemStatus()
        const interval = setInterval(checkSystemStatus, 10000)

        const saved = localStorage.getItem('ltx_tasks_detailed')
        if (saved) {
            const parsed = JSON.parse(saved)
            setTasks(parsed)
            if (parsed.length > 0) setSelectedVideo(parsed[0])
        }
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'processing')
        if (activeTasks.length > 0) {
            const pollInterval = setInterval(() => {
                activeTasks.forEach(t => pollTaskStatus(t.id))
            }, 3000)
            return () => clearInterval(pollInterval)
        }
        localStorage.setItem('ltx_tasks_detailed', JSON.stringify(tasks))
    }, [tasks])

    const handleTaskCreated = (taskId: string, prompt: string) => {
        const newTask: Task = { id: taskId, status: 'pending', progress: 0, prompt }
        setTasks(prev => [newTask, ...prev])
    }

    const renderStudio = () => (
        <div className="flex flex-col gap-4 h-full">
            {/* Creation Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mx-auto">
                <button
                    onClick={() => setMode('text')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative",
                        mode === 'text' ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    {mode === 'text' && (
                        <motion.div
                            layoutId="activeMode"
                            className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Video className="w-4 h-4" />
                    <span className="relative z-10">Text to Video</span>
                </button>
                <button
                    onClick={() => setMode('image')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative",
                        mode === 'image' ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    {mode === 'image' && (
                        <motion.div
                            layoutId="activeMode"
                            className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <ImageIcon className="w-4 h-4" />
                    <span className="relative z-10">Image to Video</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 flex-1 overflow-hidden">
                {/* Left Column: Input and Title */}
                <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                {mode === 'text' ? 'Text To Video' : 'Image To Video'}
                            </h1>
                        </div>
                        <GenerationForm
                            onTaskCreated={handleTaskCreated}
                            isPipelineLoaded={isPipelineLoaded}
                            mode={mode as 'text' | 'image'}
                        />
                    </div>
                </div>

                {/* Right Column: Professional Video Player */}
                <div className="h-full">
                    <div className="sticky top-0 h-full flex flex-col pt-0">
                        <VideoPlayer
                            videoUrl={selectedVideo?.videoUrl}
                            title={selectedVideo?.id ? `Artifact: ${selectedVideo.id.slice(0, 8)}` : "Video Preview"}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-[#020617] text-white flex">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 ml-64 h-screen relative flex flex-col overflow-hidden">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-12 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-40 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className={cn("w-2 h-2 rounded-full", isPipelineLoaded ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isPipelineLoaded ? "text-emerald-400" : "text-red-400")}>
                                {isPipelineLoaded ? 'Engine Active' : 'Engine Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cluster Queue: {systemStats.active_tasks}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/5 mx-2" />
                        <AccountMenu />
                    </div>
                </header>

                <div className="flex-1 px-12 pt-0 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] -z-10 rounded-full" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="h-full"
                        >
                            {activeTab === 'studio' ? renderStudio() : <SettingsView isPipelineLoaded={isPipelineLoaded} onPipelineLoaded={() => setIsPipelineLoaded(true)} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
