"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User,
    Shield,
    LogOut,
    CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export default function AccountMenu() {
    const { user, logout } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('#account-menu-container')) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div id="account-menu-container" className="relative">
            {/* Simple Circular Trigger */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center font-bold text-sm overflow-hidden",
                    isOpen
                        ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                )}
            >
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    {user?.name?.charAt(0) || 'U'}
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, originX: 1, originY: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 mt-3 w-64 bg-[#0a0f1e]/95 border border-white/5 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
                    >
                        {/* Compact Header */}
                        <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                            <p className="font-bold text-sm truncate">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {[
                                { icon: User, label: "Profile", color: "indigo" },
                                { icon: Shield, label: "Security", color: "purple" },
                                { icon: CreditCard, label: "Billing", color: "amber" }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all group"
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        item.color === "indigo" && "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white",
                                        item.color === "purple" && "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white",
                                        item.color === "amber" && "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white"
                                    )}>
                                        <item.icon className="w-3.5 h-3.5" />
                                    </div>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Logout Section */}
                        <div className="p-2 pt-0">
                            <div className="h-px bg-white/5 my-1 mx-2" />
                            <button
                                onClick={() => logout()}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all group"
                            >
                                <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <LogOut className="w-3.5 h-3.5" />
                                </div>
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
