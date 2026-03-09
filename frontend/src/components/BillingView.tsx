"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Check,
    Zap,
    Shield,
    Crown,
    ArrowRight,
    CreditCard,
    Target,
    Clock,
    History
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$0',
        description: 'Perfect for hobbyists and experimentation.',
        features: ['5 Generations / day', '720p Resolution', 'Basic LTX-2.3 models', 'Community Support'],
        icon: Zap,
        color: 'blue'
    },
    {
        id: 'pro',
        name: 'Pro Studio',
        price: '$29',
        description: 'Professional grade tools for serious creators.',
        features: ['Unlimited Generations', '1080p / 4K Upscaling', 'Advanced LTX-3 Access', 'Priority Rendering', 'Commercial Rights'],
        icon: Crown,
        color: 'indigo',
        popular: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'Built for studios and high-throughput teams.',
        features: ['Dedicated GPU Compute', 'Custom Model Tuning', 'Multi-user Management', '24/7 VIP Support', 'Custom API Access'],
        icon: Shield,
        color: 'purple'
    }
]

export default function BillingView() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    return (
        <div className="space-y-16">
            <div className="flex flex-col items-center text-center gap-4">
                <h1 className="text-5xl font-black tracking-tight text-gradient">Elevate Your Creativity</h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    Choose the perfect plan for your cinematic journey. All plans include access to our cutting-edge LTX-2.3 pipeline.
                </p>

                <div className="mt-8 p-1.5 bg-white/5 rounded-2xl flex items-center border border-white/5">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={cn("px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", billingCycle === 'monthly' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300")}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={cn("px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", billingCycle === 'yearly' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300")}
                    >
                        Yearly <span className="ml-1 text-[10px] text-emerald-400 font-black">-20%</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {PLANS.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "relative p-10 rounded-[3rem] glass-card border flex flex-col gap-8 transition-all hover:translate-y-[-8px]",
                            plan.popular ? "border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.1)]" : "border-white/5"
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-gradient-premium text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-500/40">
                                Most Popular
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className={cn("p-4 rounded-3xl w-fit", `bg-${plan.color}-500/10`)}>
                                <plan.icon className={cn("w-8 h-8", `text-${plan.color}-400`)} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                            </div>
                            <div className="pt-4">
                                <span className="text-5xl font-black">{plan.price}</span>
                                {plan.price !== 'Custom' && <span className="text-gray-500 font-bold ml-2">/ month</span>}
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">What's included</p>
                            <ul className="space-y-4">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                        <div className="p-1 rounded-full bg-indigo-500/20 flex-shrink-0">
                                            <Check className="w-3 h-3 text-indigo-400" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button className={cn(
                            "w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3",
                            plan.popular ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-xl shadow-indigo-500/20" : "bg-white/5 hover:bg-white/10 text-gray-300"
                        )}>
                            {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started Now'} <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
                <section className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl">
                            <History className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold">Billing History</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { d: 'May 01, 2026', a: '$29.00', s: 'Paid' },
                            { d: 'Apr 01, 2026', a: '$29.00', s: 'Paid' },
                            { d: 'Mar 01, 2026', a: '$29.00', s: 'Paid' }
                        ].map((inv, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <CreditCard className="w-5 h-5 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-sm font-bold text-gray-300">{inv.d}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-sm font-black tracking-tight">{inv.a}</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">{inv.s}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="p-10 rounded-[3rem] bg-gradient-premium border border-white/10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-1000" />

                    <div className="relative z-10 space-y-6">
                        <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl w-fit">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tight text-white leading-tight">Need dedicated GPU compute?</h3>
                            <p className="text-indigo-100/70 text-sm font-medium">Get your own private LTX-2.3 instance with zero queue time and maximum privacy.</p>
                        </div>
                        <button className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-[1.05] active:scale-[0.95] transition-all">
                            Explore Custom Instances
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
