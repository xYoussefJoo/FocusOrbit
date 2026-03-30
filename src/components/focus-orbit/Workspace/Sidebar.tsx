'use client';

import React from 'react';
import { useFocusStore } from '@/store/useFocusStore';

export function Sidebar() {
    const { currentView, setCurrentView } = useFocusStore();

    return (
        <aside className="fixed left-0 h-full w-64 bg-[#1C1B1D] flex flex-col py-8 px-4 gap-y-2 border-r border-white/5 z-40 hidden md:flex">
            <div className="mb-10 px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4EDE03] to-[#10B981] flex items-center justify-center">
                    <span className="material-symbols-outlined text-black text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                </div>
                <div>
                    <h1 className="text-lg font-black text-white leading-none">FocusOrbit</h1>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant/60 font-medium mt-1">Precision Workspace</p>
                </div>
            </div>
            <nav className="flex-1 space-y-1">
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className={`w-full flex items-center px-4 py-2.5 gap-3 rounded-md transition-all group ${currentView === 'dashboard' ? 'bg-gradient-to-br from-[#4EDE03] to-[#10B981] text-black font-bold transform active:scale-95' : 'text-[#BBCABF] hover:text-white hover:bg-[#2A2A2C] font-medium'}`}
                >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentView === 'dashboard' ? "'FILL' 1" : "" }}>dashboard</span>
                    <span className="text-sm">Dashboard</span>
                </button>
                <button 
                    onClick={() => setCurrentView('ide')}
                    className={`w-full flex items-center px-4 py-2.5 gap-3 rounded-md transition-all group ${currentView === 'ide' ? 'bg-gradient-to-br from-[#4EDE03] to-[#10B981] text-black font-bold transform active:scale-95' : 'text-[#BBCABF] hover:text-white hover:bg-[#2A2A2C] font-medium'}`}
                >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentView === 'ide' ? "'FILL' 1" : "" }}>terminal</span>
                    <span className="text-sm">Orbit IDE</span>
                </button>
                <button className="w-full flex items-center px-4 py-2.5 gap-3 text-[#BBCABF] hover:text-white hover:bg-[#2A2A2C] transition-all rounded-md group">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="text-sm font-medium">Tasks</span>
                </button>
            </nav>
            <div className="mt-auto space-y-1">
                <button 
                    onClick={() => { setCurrentView('ide'); useFocusStore.getState().startTimer(); }}
                    className="w-full mb-6 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 px-4 rounded-md border border-white/10 transition-colors uppercase tracking-widest"
                >
                    New Session
                </button>
                <a className="flex items-center px-4 py-2 gap-3 text-[#BBCABF]/70 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span className="text-[11px] uppercase tracking-wider">Help</span>
                </a>
                <a className="flex items-center px-4 py-2 gap-3 text-[#BBCABF]/70 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    <span className="text-[11px] uppercase tracking-wider">Settings</span>
                </a>
            </div>
        </aside>
    );
}
