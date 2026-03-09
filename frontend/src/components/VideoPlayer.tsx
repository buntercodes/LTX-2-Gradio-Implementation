"use client"

import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Download,
    Clapperboard,
    Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
    videoUrl?: string;
    title?: string;
    aspectRatio?: string;
}

export default function VideoPlayer({ videoUrl, title = "Video Preview", aspectRatio = "16/9" }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isHovering, setIsHovering] = useState(false)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause()
            else videoRef.current.play()
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime
            const total = videoRef.current.duration
            setProgress((current / total) * 100)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (parseFloat(e.target.value) / 100) * duration
            videoRef.current.currentTime = seekTime
            setProgress(parseFloat(e.target.value))
        }
    }

    const handleFullscreen = () => {
        if (videoRef.current) {
            videoRef.current.requestFullscreen()
        }
    }

    return (
        <div
            className="w-full flex flex-col gap-6"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Clapperboard className="w-5 h-5 text-indigo-400" />
                        {title}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative group aspect-video w-full rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/5 shadow-2xl">
                {!videoUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-600">
                        <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                            <Monitor className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="text-sm font-medium tracking-tight">Generate a video to preview here</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onClick={togglePlay}
                            loop
                        />

                        {/* Custom Controls Overlay */}
                        <AnimatePresence>
                            {(isHovering || !isPlaying) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 gap-6"
                                >
                                    {/* Progress Bar */}
                                    <div className="relative w-full group/progress">
                                        <input
                                            type="range"
                                            value={progress}
                                            onChange={handleSeek}
                                            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-indigo-500 group-hover/progress:h-2 transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={togglePlay}
                                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/10"
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                            </button>

                                            <div className="flex items-center gap-4">
                                                <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                                <span className="text-xs font-bold text-white/50 tracking-widest font-mono">
                                                    {Math.floor(videoRef.current?.currentTime || 0)}s / {Math.floor(duration)}s
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleFullscreen}
                                            className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all"
                                        >
                                            <Maximize className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

        </div>
    )
}
