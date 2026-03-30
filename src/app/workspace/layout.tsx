import React from 'react';
import { Sidebar } from '@/components/focus-orbit/Workspace/Sidebar';
import { TopNav } from '@/components/focus-orbit/Workspace/TopNav';
import { MobileNav } from '@/components/focus-orbit/Workspace/MobileNav';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden h-screen flex">
            <Sidebar />
            <main className="flex-1 flex flex-col md:ml-64 relative min-h-screen overflow-y-auto custom-scrollbar">
                <TopNav />
                {children}
            </main>
            <MobileNav />
        </div>
    );
}
