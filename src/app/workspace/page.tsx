'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IdeWorkspace } from '@/components/focus-orbit/IdeWorkspace';
import { useFocusStore } from '@/store/useFocusStore';

// This is extracted directly from the previous page.tsx Dashboard.
function DashboardMetrics() {
    return (
        <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto w-full">
            <div className="mb-12">
                <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mb-2 block">System Status: Active</span>
                <h2 className="text-4xl font-extrabold tracking-tighter text-white mb-2">Workspace Overview</h2>
                <p className="text-on-surface-variant max-w-lg text-sm leading-relaxed">Your neural flow is currently at 84%. Three high-priority tasks are awaiting your immediate focus.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,_auto)]">
                {/* Current Focus Session (Pomodoro) */}
                <div className="md:col-span-8 lg:col-span-5 bg-surface-container-low glass-card rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Current Focus Session</h3>
                            <p className="text-xs text-on-surface-variant">Project: Neural Interface Redesign</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">more_horiz</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-4 relative z-10">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="4"></circle>
                                <circle className="text-primary" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="553" strokeDashoffset="140" strokeWidth="4"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black tracking-tighter text-white">18:42</span>
                                <span className="text-[10px] font-bold text-primary tracking-[0.1em] uppercase mt-1">Focus Flow</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8 relative z-10">
                        <button className="flex-1 bg-gradient-to-br from-[#4EDE03] to-[#10B981] text-black py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
                            Pause
                        </button>
                        <button className="px-6 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all active:scale-95">
                            <span className="material-symbols-outlined">stop</span>
                        </button>
                    </div>
                </div>

                {/* 90-Day Progress Bar Chart */}
                <div className="md:col-span-4 lg:col-span-7 bg-surface-container-low glass-card rounded-xl p-8 flex flex-col">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">90-Day Progress</h3>
                            <p className="text-xs text-on-surface-variant">Architecture & System Design</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-white">72%</span>
                            <span className="text-[10px] block text-primary font-bold uppercase tracking-tighter">+12.4% vs prev</span>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-2 h-48">
                        <div className="w-full bg-white/5 rounded-t-sm h-[25%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[40%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[50%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[60%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[66%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[80%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-primary/20 border-t border-primary/40 rounded-t-sm h-full transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[75%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[50%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[66%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[80%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-full hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[75%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                        <div className="w-full bg-white/5 rounded-t-sm h-[50%] hover:bg-primary/40 transition-all cursor-pointer"></div>
                    </div>
                    <div className="mt-6 flex justify-between text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                    </div>
                </div>

                {/* High-Impact Tasks */}
                <div className="md:col-span-6 lg:col-span-4 bg-surface-container-low glass-card rounded-xl p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">High-Impact Tasks</h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-tighter">AI Prioritized</span>
                    </div>
                    <div className="space-y-4">
                        <div className="group flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-0.5">Refactor Core Loop</p>
                                    <p className="text-[10px] text-on-surface-variant/60 uppercase">3h Estimated</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        </div>
                        <div className="group flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-0.5">Asset Optimization</p>
                                    <p className="text-[10px] text-on-surface-variant/60 uppercase">1.5h Estimated</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">auto_awesome</span>
                        </div>
                        <div className="group flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-0.5">SEO Meta Strategy</p>
                                    <p className="text-[10px] text-on-surface-variant/60 uppercase">45m Estimated</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">trending_up</span>
                        </div>
                    </div>
                </div>

                {/* Bento: Mini Metrics */}
                <div className="md:col-span-6 lg:col-span-4 grid grid-cols-2 gap-6">
                    <div className="bg-surface-container-low glass-card rounded-xl p-6 flex flex-col justify-between border border-white/5">
                        <span className="material-symbols-outlined text-primary text-xl">workspaces</span>
                        <div>
                            <p className="text-2xl font-black text-white">12</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Active Projects</p>
                        </div>
                    </div>
                    <div className="bg-surface-container-low glass-card rounded-xl p-6 flex flex-col justify-between border border-white/5">
                        <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                        <div>
                            <p className="text-2xl font-black text-white">42h</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Focus This Week</p>
                        </div>
                    </div>
                    <div className="bg-surface-container-low glass-card rounded-xl p-6 flex flex-col justify-between border border-white/5">
                        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                        <div>
                            <p className="text-2xl font-black text-white">88%</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Neural Flow</p>
                        </div>
                    </div>
                    <div className="bg-surface-container-low glass-card rounded-xl p-6 flex flex-col justify-between border border-white/5">
                        <span className="material-symbols-outlined text-primary text-xl">emoji_events</span>
                        <div>
                            <p className="text-2xl font-black text-white">5k</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Orbit XP</p>
                        </div>
                    </div>
                </div>

                {/* Bento: Recent Session Clip */}
                <div className="md:col-span-12 lg:col-span-4 bg-surface-container-low glass-card rounded-xl overflow-hidden relative group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B1D] via-transparent to-transparent z-10"></div>
                    <img 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        alt="Abstract visualization of focus" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC19VeC18CK4iSnf0PO8slZJ68r0-gm7M1OFf0y65myOYjuMs91GKmWZeJZCMTR6Zia_f2Q8rY8RXHt84UDnLjCn0Sc0zsAEIl7tNfsdSo-nX0qqGH8f87MHXd_HPBe-0dVm_Ou9GiLuxtXc3ZyvG0cZyGHMwt51BAzKvsX5AllYToF-HrF4QZBGFeUGy_BdwetBgLsWlT75FVbHU3EuxWYIey4l4OqFeYCUw3m1TT1fEUDWtNmq7ufby0GDfyX-8SmDyL3k_JQ5g"
                    />
                    <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Insight Highlight</span>
                        <h4 className="text-xl font-bold text-white tracking-tight leading-tight mb-4">You were 22% more productive during evening sessions this week.</h4>
                        <button className="w-max text-xs font-bold text-white flex items-center gap-2 group/btn">
                            View Detailed Analysis
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <footer className="mt-12 w-full py-6 border-t border-white/5 flex justify-between items-center">
                <p className="text-[10px] uppercase tracking-[0.05em] font-['Inter'] text-[#BBCABF]/50">© 2024 FocusOrbit Precision Systems</p>
                <div className="flex gap-6">
                    <a className="text-[10px] uppercase tracking-[0.05em] font-['Inter'] text-[#BBCABF]/50 hover:text-[#10b981] transition-colors" href="#">Privacy</a>
                    <a className="text-[10px] uppercase tracking-[0.05em] font-['Inter'] text-[#BBCABF]/50 hover:text-[#10b981] transition-colors" href="#">Terms</a>
                    <a className="text-[10px] uppercase tracking-[0.05em] font-['Inter'] text-[#BBCABF]/50 hover:text-[#10b981] transition-colors" href="#">API Status</a>
                </div>
            </footer>
        </div>
    );
}

export default function WorkspaceSwitcherPage() {
    const { currentView, setCurrentView } = useFocusStore();

    return (
        <div className="flex-1 w-full h-full relative">
            {/* Dev Helper Switch - removed since Sidebar handles this perfectly now */}
            <AnimatePresence mode="wait">
                {currentView === 'dashboard' ? (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full h-full pb-16"
                    >
                        <DashboardMetrics />
                    </motion.div>
                ) : (
                    <motion.div
                        key="ide"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full h-full absolute inset-0 pt-16 mt-0 bg-surface z-50 overflow-hidden" // Absolute over layout padding
                    >
                        <IdeWorkspace />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
