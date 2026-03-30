'use client';

import { useEffect } from 'react';
import { useFocusStore } from '@/store/useFocusStore';
import Editor from '@monaco-editor/react';
import { UserButton } from '@clerk/nextjs';

export function IdeWorkspace() {
  const { 
    isDeepFocus, 
    toggleDeepFocus, 
    pomodoroTime, 
    isTimerRunning, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    tickTimer 
  } = useFocusStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => tickTimer(), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const mockCode = `using Microsoft.AspNetCore.Mvc;
using FocusOrbit.Application.FocusSessions;

namespace FocusOrbit.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FocusController : ControllerBase
{
    private readonly IFocusService _focusService;

    public FocusController(IFocusService focusService)
    {
        _focusService = focusService;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartSession([FromBody] SessionRequest request)
    {
        // Initiating deep focus orbit...
        var result = await _focusService.Initiate(request.Duration);
        return Ok(result);
    }
}`;

  // Calculates offset for circle based on max time (1500 sec = 25 minutes). Circumference is ~553
  const maxTime = 25 * 60;
  const progressOffset = isTimerRunning || pomodoroTime < maxTime 
        ? ((maxTime - pomodoroTime) / maxTime) * 553 
        : 553; 

  return (
    <div className="bg-surface text-on-surface font-body overflow-hidden h-screen select-none w-full">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-6 h-12 w-full fixed top-0 z-50 bg-[#131315]/70 backdrop-blur-xl border-b border-white/5 font-['Inter'] text-sm tracking-tight shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-6">
          <span className="text-emerald-400 font-bold tracking-tighter text-lg">FocusOrbit</span>
          <nav className="hidden lg:flex items-center gap-4">
            <a className="text-white font-medium border-b border-emerald-500 hover:text-emerald-400 transition-colors duration-200" href="#">File</a>
            <a className="text-[#BBCABF] hover:text-emerald-400 transition-colors duration-200" href="#">Edit</a>
            <a className="text-[#BBCABF] hover:text-emerald-400 transition-colors duration-200" href="#">Selection</a>
            <a className="text-[#BBCABF] hover:text-emerald-400 transition-colors duration-200" href="#">View</a>
            <a className="text-[#BBCABF] hover:text-emerald-400 transition-colors duration-200" href="#">Go</a>
            <a className="text-[#BBCABF] hover:text-emerald-400 transition-colors duration-200" href="#">Run</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDeepFocus}
            className="flex items-center gap-2 bg-primary-container/20 text-primary px-3 py-1 rounded-lg border border-primary/20 hover:bg-primary-container/30 transition-all active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-sm">exit_to_app</span>
            <span className="font-semibold text-xs tracking-wider uppercase">Exit Focus</span>
          </button>
          <div className="flex items-center gap-3 text-[#BBCABF]">
            <span className="material-symbols-outlined hover:text-emerald-400 cursor-pointer">settings</span>
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full">
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

      {/* SideNavBar */}
      <aside className="fixed left-0 top-12 bottom-0 w-16 flex flex-col items-center py-4 z-40 bg-[#1C1B1D] transition-all duration-300 ease-in-out">
        <div className="flex flex-col gap-6 items-center w-full">
          <div className="w-full flex justify-center py-2 text-emerald-400 border-l-2 border-emerald-500 bg-emerald-500/5 group cursor-pointer">
            <span className="material-symbols-outlined">folder</span>
          </div>
          <div className="w-full flex justify-center py-2 text-[#BBCABF]/50 hover:text-[#BBCABF] hover:bg-white/5 transition-all group cursor-pointer">
            <span className="material-symbols-outlined">search</span>
          </div>
          <div className="w-full flex justify-center py-2 text-[#BBCABF]/50 hover:text-[#BBCABF] hover:bg-white/5 transition-all group cursor-pointer">
            <span className="material-symbols-outlined">account_tree</span>
          </div>
          <div className="w-full flex justify-center py-2 text-[#BBCABF]/50 hover:text-[#BBCABF] hover:bg-white/5 transition-all group cursor-pointer">
            <span className="material-symbols-outlined">extension</span>
          </div>
          <div className="w-full flex justify-center py-2 text-[#BBCABF]/50 hover:text-[#BBCABF] hover:bg-white/5 transition-all group cursor-pointer">
            <span className="material-symbols-outlined">timer</span>
          </div>
        </div>
        <div className="mt-auto w-full flex justify-center py-4 text-[#BBCABF]/50 hover:text-[#BBCABF] hover:bg-white/5 transition-all cursor-pointer">
          <span className="material-symbols-outlined">settings</span>
        </div>
      </aside>

      {/* Main Workspace Layout */}
      <main className="ml-16 mt-12 h-[calc(100vh-3rem)] grid grid-cols-12 overflow-hidden bg-surface">
        {/* Explorer Sidebar */}
        <section className="col-span-2 border-r border-outline-variant/30 bg-surface-container-low flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <span className="text-[11px] font-medium tracking-widest uppercase text-on-surface-variant">Explorer</span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant opacity-50 cursor-pointer">more_horiz</span>
          </div>
          <div className="px-2 py-1 overflow-y-auto flex-1 text-sm font-body">
            {/* Project Folder */}
            <div className="flex items-center gap-1.5 px-2 py-1 text-on-surface">
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
              <span className="material-symbols-outlined text-sm text-primary">terminal</span>
              <span className="font-semibold">FocusOrbit.Core</span>
            </div>
            {/* Clean Architecture Folders */}
            <div className="ml-4 space-y-0.5">
              <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                <span className="material-symbols-outlined text-sm text-[#BBCABF]">folder</span>
                <span className="text-on-surface-variant group-hover:text-on-surface">Domain</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                <span className="material-symbols-outlined text-sm text-[#BBCABF]">folder</span>
                <span className="text-on-surface-variant group-hover:text-on-surface">Application</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                <span className="material-symbols-outlined text-sm text-[#BBCABF]">folder</span>
                <span className="text-on-surface-variant group-hover:text-on-surface">Infrastructure</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded cursor-pointer group">
                  <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                  <span className="material-symbols-outlined text-sm text-[#BBCABF]">folder_open</span>
                  <span className="text-on-surface">API</span>
                </div>
                <div className="ml-6 space-y-0.5 mt-0.5">
                  <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                    <span className="material-symbols-outlined text-sm text-blue-400">code</span>
                    <span className="text-on-surface-variant group-hover:text-on-surface">Program.cs</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded cursor-pointer group">
                    <span className="material-symbols-outlined text-sm text-primary">integration_instructions</span>
                    <span className="text-primary font-medium">FocusController.cs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editor Pane  */}
        <section className="col-span-7 bg-surface relative flex flex-col border-r border-outline-variant/30">
          {/* Tabs */}
          <div className="flex h-9 bg-surface-container-low border-b border-outline-variant/30">
            <div className="px-4 flex items-center gap-2 bg-surface text-xs border-r border-outline-variant/30 text-on-surface">
              <span className="material-symbols-outlined text-[14px] text-primary">integration_instructions</span>
              FocusController.cs
              <span className="material-symbols-outlined text-[12px] opacity-40 hover:opacity-100 cursor-pointer">close</span>
            </div>
            <div className="px-4 flex items-center gap-2 text-xs border-r border-outline-variant/30 text-on-surface-variant hover:bg-white/5 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[14px] text-blue-400">code</span>
              Program.cs
              <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100">close</span>
            </div>
          </div>
          {/* Editor Content */}
          <div className="flex-1 w-full h-full relative">
            <Editor
                height="100%"
                defaultLanguage="csharp"
                theme="vs-dark"
                value={mockCode}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'Consolas, monospace',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 16 }
                }}
            />
          </div>

          {/* Deep Focus Toggle Float */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 glass-panel rounded-full border border-white/10 shadow-2xl">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">Deep Focus</span>
            <button 
                onClick={toggleDeepFocus}
                className="w-10 h-5 bg-primary-container rounded-full relative flex items-center transition-all duration-300">
              <div className="absolute right-1 w-3.5 h-3.5 bg-white rounded-full"></div>
            </button>
          </div>
        </section>

        {/* Focus Hub */}
        <section className="col-span-3 bg-surface-container-low flex flex-col p-8 space-y-12">
          {/* Timer Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Circular Progress Background */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle className="text-surface-container-high" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-primary transition-all duration-1000" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset={progressOffset} strokeWidth="4"></circle>
              </svg>
              {/* Time Display */}
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl font-bold tracking-tight text-on-surface">{formatTime(pomodoroTime)}</span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mt-1">Deep Work</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={isTimerRunning ? pauseTimer : startTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface"
              >
                <span className="material-symbols-outlined">{isTimerRunning ? 'pause' : 'play_arrow'}</span>
              </button>
              <button 
                onClick={resetTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          {/* Task Status List */}
          <div className="flex flex-col gap-6 flex-1">
            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">Active Task Status</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-on-surface">Update API Controllers</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/5 group opacity-60 hover:opacity-100 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Infrastructure Setup</span>
                  <span className="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded uppercase font-bold tracking-wider">Queue</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-outline-variant w-0 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/5 group opacity-60 hover:opacity-100 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Unit Testing Core</span>
                  <span className="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded uppercase font-bold tracking-wider">Queue</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-outline-variant w-0 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Meta */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-medium text-on-surface-variant">System Ready</span>
            </div>
            <span className="text-[10px] font-medium text-on-surface-variant/40 italic">FocusOrbit v1.0.4</span>
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-6 bg-primary-container text-on-primary-container flex items-center px-4 justify-between z-50 text-[10px] font-medium tracking-wide">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-black/10 px-2 h-full">
            <span className="material-symbols-outlined text-[12px]">account_tree</span>
            <span>main*</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-black/10 px-2 h-full">
            <span className="material-symbols-outlined text-[12px]">sync</span>
            <span>In Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>C#</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">notifications</span>
            <span>3 Notifications</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
