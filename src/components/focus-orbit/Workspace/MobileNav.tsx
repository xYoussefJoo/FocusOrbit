import React from 'react';

export function MobileNav() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#131315]/90 backdrop-blur-xl h-16 flex justify-around items-center border-t border-white/5 z-[60]">
            <a className="flex flex-col items-center gap-1 text-primary" href="#">
                <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                <span className="text-[10px] font-medium leading-none">Focus</span>
            </a>
            <a className="flex flex-col items-center gap-1 text-[#BBCABF]" href="#">
                <span className="material-symbols-outlined mb-1">folder_open</span>
                <span className="text-[10px] font-medium leading-none">Projects</span>
            </a>
            <a className="flex flex-col items-center gap-1 text-[#BBCABF]" href="#">
                <span className="material-symbols-outlined mb-1">insights</span>
                <span className="text-[10px] font-medium leading-none">Analytics</span>
            </a>
            <a className="flex flex-col items-center gap-1 text-[#BBCABF]" href="#">
                <span className="material-symbols-outlined mb-1">check_circle</span>
                <span className="text-[10px] font-medium leading-none">Tasks</span>
            </a>
        </nav>
    );
}
