"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Play, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
    task_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';
    progress: number;
    message: string;
    video_url?: string;
}

interface VideoCardProps {
    taskId: string;
    onRemove: (taskId: string) => void;
}

export default function VideoCard({ taskId, onRemove }: VideoCardProps) {
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchStatus = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${taskId}`)
            if (!resp.ok) throw new Error('Task not found')
            const data = await resp.json()
            setTask(data)

            // Stop polling if task is finished
            if (['completed', 'failed', 'canceled'].includes(data.status)) {
                return false
            }
            return true
        } catch (err) {
            console.error(err)
            return false
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timeout

        fetchStatus().then(shouldContinue => {
            if (shouldContinue) {
                interval = setInterval(async () => {
                    const cont = await fetchStatus()
                    if (!cont) clearInterval(interval)
                }, 3000)
            }
        })

        return () => clearInterval(interval)
    }, [taskId])

    if (loading && !task) {
        return (
            <div className="w-full h-48 rounded-2xl glass-card animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
            </div>
        )
    }

    const handleCancel = async () => {
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${taskId}`, {
                method: 'DELETE'
            })
            if (resp.ok) {
                fetchStatus() // Refresh status
            }
        } catch (err) {
            console.error('Failed to cancel task:', err)
        }
    }

    const handleRemoveAction = () => {
        if (['queued', 'processing'].includes(task?.status || '')) {
            if (confirm('Are you sure you want to cancel this active generation?')) {
                handleCancel()
            }
        } else {
            onRemove(taskId)
        }
    }

    const isCompleted = task?.status === 'completed'
    const isFailed = task?.status === 'failed'
    const isCanceled = task?.status === 'canceled'
    const isProcessing = task?.status === 'processing'
    const isQueued = task?.status === 'queued'

    const videoFullUrl = task?.video_url ? `${process.env.NEXT_PUBLIC_API_URL}${task.video_url}` : null

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative w-full overflow-hidden rounded-2xl glass-card border border-white/5 hover:border-white/10 transition-all"
        >
            <div className="aspect-video relative bg-black/40 overflow-hidden">
                {isCompleted && videoFullUrl ? (
                    <video
                        src={videoFullUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loop
                        muted
                        autoPlay={false}
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                            e.currentTarget.pause()
                            e.currentTarget.currentTime = 0
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                        {isFailed || isCanceled ? (
                            <XCircle className="w-12 h-12 text-red-500/50" />
                        ) : (
                            <div className="relative">
                                <Play className={cn("w-12 h-12 opacity-10", isProcessing && "animate-pulse")} />
                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="font-semibold text-lg capitalize">{task?.status}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{task?.message || 'Queued in line...'}</p>
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                        <motion.div
                            className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(task?.progress || 0) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                )}
            </div>

            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xs font-medium text-gray-500 truncate italic">"{task?.status === 'completed' ? taskId : taskId.slice(0, 12) + '...'}"</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isCompleted && videoFullUrl && (
                        <a
                            href={videoFullUrl}
                            download
                            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    )}
                    <button
                        onClick={handleRemoveAction}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            ['queued', 'processing'].includes(task?.status || '')
                                ? "hover:bg-red-500/10 text-red-500/50 hover:text-red-500"
                                : "hover:bg-white/5 text-gray-400 hover:text-white"
                        )}
                        title={['queued', 'processing'].includes(task?.status || '') ? "Cancel Task" : "Remove from list"}
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
