"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Video,
    Cpu,
    LogOut,
    ChevronRight,
    Activity,
    ExternalLink,
    CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const MENU_ITEMS = [
    { id: 'studio', label: 'Studio', icon: Video },
    { id: 'settings', label: 'Settings', icon: Cpu },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const { logout } = useAuth()
    const router = useRouter()
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/5 flex flex-col z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                    <Cpu className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gradient">LTX Studio</span>
            </div>

            <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Core</p>
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group outline-none",
                                activeTab === item.id
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-400" : "group-hover:text-gray-300")} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-medium">Pipeline Status</span>
                        <span className="text-[10px] text-emerald-400 font-bold">READY</span>
                    </div>
                </div>

                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group outline-none"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
