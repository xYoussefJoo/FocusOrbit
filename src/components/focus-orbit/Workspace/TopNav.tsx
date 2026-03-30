import React from 'react';
import { Input } from '@/components/ui/input';
import { UserButton } from '@clerk/nextjs';

export function TopNav() {
    return (
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-[#131315]/70 backdrop-blur-xl flex justify-between items-center px-8 z-50 border-b border-white/5">
            <div className="flex items-center flex-1 max-w-xl">
                <div className="relative w-full group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">search</span>
                    <Input 
                        className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all h-9" 
                        placeholder="Search focus logs, tasks, or projects..." 
                        type="text"
                    />
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                    <button className="text-[#BBCABF] hover:text-white transition-colors active:scale-95 duration-200">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="text-[#BBCABF] hover:text-white transition-colors active:scale-95 duration-200">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
                <div className="h-8 w-[1px] bg-white/10"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-white leading-none">FocusOrbit</p>
                        <p className="text-[10px] text-primary mt-1 font-medium">Workspace</p>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full bg-white/5 overflow-hidden">
                        <UserButton 
                            appearance={{
                                elements: {
                                    avatarBox: "w-full h-full",
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
