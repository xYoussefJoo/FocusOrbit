import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SignInButton } from '@clerk/nextjs';

export default async function LandingPage() {
    // If the user is already signed in, redirect them to /workspace automatically.
    const { userId } = await auth();
    if (userId) {
        redirect('/workspace');
    }

    return (
        <div className="bg-[#131315] text-[#FAFAFA] font-['Inter'] selection:bg-[#4EDE03]/20 selection:text-[#4EDE03] leading-relaxed min-h-screen relative overflow-x-hidden antialiased">
            {/* Global Design System Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#10B981]/5 to-transparent blur-[120px] rounded-[100%]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="relative z-10">
                {/* Navigation Bar */}
                <nav className="fixed top-0 w-full backdrop-blur-md bg-[#131315]/70 border-b border-white/5 z-50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4EDE03] to-[#10B981] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <span className="material-symbols-outlined text-black font-medium" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white">FocusOrbit</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
                            <a className="text-[#BBCABF] hover:text-white transition-colors" href="#features">Features</a>
                            <a className="text-[#BBCABF] hover:text-white transition-colors" href="#ide">Orbit IDE</a>
                            <a className="text-[#BBCABF] hover:text-white transition-colors" href="#pricing">Pricing</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a className="hidden md:block text-sm font-medium text-[#BBCABF] hover:text-white transition-colors" href="/sign-in">Log in</a>
                            <SignInButton fallbackRedirectUrl="/workspace">
                                <button className="cursor-pointer bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold tracking-wide hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                    Get Started
                                </button>
                            </SignInButton>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="pt-48 pb-32 px-8 flex flex-col items-center text-center relative max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-12 transform hover:scale-105 transition-all duration-300 cursor-pointer group">
                        <div className="w-2 h-2 rounded-full bg-[#4EDE03] animate-pulse"></div>
                        <span className="text-xs font-semibold tracking-widest uppercase text-[#BBCABF] group-hover:text-white transition-colors">Neural Sync v2.0 Live</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none mb-8">
                        Master Your 
                        <span className="inline-block px-4 mx-2 bg-gradient-to-r from-[#4EDE03] to-[#10B981] text-transparent bg-clip-text transform -rotate-2">
                        90-Day
                        </span>
                        Flow
                    </h1>
                    
                    <p className="text-lg md:text-xl text-[#BBCABF] max-w-2xl font-medium leading-relaxed mb-12">
                        FocusOrbit is the opinionated environment for developers who treat productivity as an engineering problem. Zero distractions. Pure velocity.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <SignInButton fallbackRedirectUrl="/workspace">
                            <button className="h-14 px-10 rounded-full bg-gradient-to-br from-[#4EDE03] to-[#10B981] text-black font-black tracking-wider uppercase text-sm flex items-center gap-3 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-95">
                                Enter the Orbit
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </SignInButton>
                        <a className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-widest hover:opacity-70 transition-opacity" href="#features">
                            <span className="material-symbols-outlined">play_circle</span>
                            View Capabilities
                        </a>
                    </div>
                </header>

                {/* Main Content Sections */}
                <main className="max-w-7xl mx-auto px-8 space-y-32 pb-32">

                    {/* Bento Grid Layout Section */}
                    <section id="features" className="pt-16">
                        <div className="flex justify-between items-end mb-16">
                            <div className="max-w-xl">
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">Designed for Deep Work</h2>
                                <p className="text-[#BBCABF] leading-relaxed">Everything you need to orchestrate a 90-day sprint. We've stripped out the bloat so you can focus strictly on the architecture.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
                            {/* Feature 1: Progress Tracker */}
                            <div className="md:col-span-2 bg-[#1C1B1D] rounded-[32px] p-10 flex flex-col justify-between group overflow-hidden relative border border-white/5 hover:border-white/10 transition-colors">
                                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#10B981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                <div className="max-w-md relative z-10">
                                    <h3 className="text-2xl font-bold text-white mb-4">90-Day Visual Momentum</h3>
                                    <p className="text-[#BBCABF] text-sm leading-relaxed mb-8">Watch your micro-efforts compound into macro-architectures. Our algorithmic progress bars quantify your neural flow over a structured 3-month sprint.</p>
                                </div>
                                <div className="w-full flex gap-2 h-32 items-end relative z-10">
                                    <div className="w-full bg-[#2A2A2C] rounded-t-lg h-[20%] group-hover:bg-[#10B981]/20 transition-all duration-500 delay-75"></div>
                                    <div className="w-full bg-[#2A2A2C] rounded-t-lg h-[45%] group-hover:bg-[#10B981]/40 transition-all duration-500 delay-100"></div>
                                    <div className="w-full bg-[#2A2A2C] rounded-t-lg h-[30%] group-hover:bg-[#10B981]/20 transition-all duration-500 delay-150"></div>
                                    <div className="w-full bg-[#4EDE03] rounded-t-lg h-[85%] group-hover:shadow-[0_0_30px_rgba(78,222,3,0.4)] transition-all duration-500 delay-200"></div>
                                    <div className="w-full bg-[#2A2A2C] rounded-t-lg h-[60%] group-hover:bg-[#10B981]/40 transition-all duration-500 delay-300"></div>
                                    <div className="w-full bg-[#2A2A2C] rounded-t-lg h-[90%] group-hover:bg-[#10B981]/60 transition-all duration-500 delay-500"></div>
                                </div>
                            </div>

                            {/* Feature 2: AI Prioritizer */}
                            <div className="bg-[#1C1B1D] rounded-[32px] p-10 flex flex-col border border-white/5 hover:border-[#10B981]/30 transition-colors group relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl group-hover:bg-[#10B981]/20 transition-all duration-700"></div>
                                <span className="material-symbols-outlined text-4xl text-[#4EDE03] mb-8" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                                <h3 className="text-xl font-bold text-white mb-4">Neural Prioritizer</h3>
                                <p className="text-[#BBCABF] text-sm leading-relaxed flex-1">Our engine strips away noise, automatically bubbling up the 3 ultra-high impact tasks you need to crush today.</p>
                                
                                <div className="mt-8 space-y-3 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="h-10 bg-[#2A2A2C] rounded-lg border-l-2 border-[#4EDE03] flex items-center px-4">
                                        <div className="w-2/3 h-2 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="h-10 bg-[#2A2A2C] rounded-lg border-l-2 border-white/10 flex items-center px-4">
                                        <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Orbit IDE Integration Section */}
                    <section id="ide" className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#10B981]/5 to-transparent blur-3xl -z-10 rounded-[100px] transform -rotate-1"></div>
                        
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-[#10B981] font-bold tracking-[0.2em] uppercase text-xs block mb-4">The Command Center</span>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">Experience the Unified Flow</h2>
                            <p className="text-[#BBCABF] text-lg leading-relaxed">Say goodbye to switching contexts. FocusOrbit integrates a hyper-tuned syntax environment directly alongside your Pomodoro sessions and structural goals.</p>
                        </div>

                        <div className="w-full bg-[#131315] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col">
                            {/* Fake IDE Header */}
                            <div className="h-12 bg-[#1C1B1D] border-b border-white/5 flex items-center px-4 justify-between">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                                </div>
                                <div className="flex gap-4 text-xs font-medium text-white/40">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">file_copy</span> FocusController.cs</span>
                                </div>
                                <div className="w-16"></div> {/* Spacer for center alignment */}
                            </div>

                            {/* IDE Content Area (Visual Mock for Landing Page) */}
                            <div className="flex h-[400px]">
                                {/* Sidebar fake */}
                                <div className="w-64 border-r border-white/5 bg-[#171618] p-4 hidden md:block opacity-50">
                                    <div className="flex items-center gap-2 mb-4 text-[#BBCABF] text-xs font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-sm text-[#10B981]">folder_open</span>
                                        Project System
                                    </div>
                                    <div className="space-y-3 font-mono text-xs text-white/40 pl-2">
                                        <p>+ Core.Domain</p>
                                        <p className="text-white">+ App.BusinessLogic</p>
                                        <p className="pl-4 text-[#10B981]">&gt; FocusController.cs</p>
                                        <p className="pl-4">  AuthService.cs</p>
                                        <p>+ UI.ReactClient</p>
                                    </div>
                                </div>
                                
                                {/* Editor Space Fake */}
                                <div className="flex-1 bg-[#131315] p-8 font-mono text-sm overflow-hidden relative group">
                                    <pre className="text-[#A1B3B8] leading-loose">
                                        <span className="text-[#C678DD]">public async Task</span>&lt;IActionResult&gt; StartSession(<span className="text-[#E5C07B]">SessionRequest</span> req)<br/>
                                        &#123;<br/>
                                        <span className="text-[#5C6370]">    // Initiating deep orbit sequence...</span><br/>
                                        <span className="text-[#C678DD]">    var</span> result = <span className="text-[#C678DD]">await</span> _focusService.Ignite(req.Duration);<br/>
                                        <span className="text-[#C678DD]">    return</span> <span className="text-[#61AFEF]">Ok</span>(result);<br/>
                                        &#125;
                                    </pre>
                                    
                                    {/* Action Float */}
                                    <div className="absolute inset-0 bg-[#131315]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <SignInButton fallbackRedirectUrl="/workspace">
                                            <button className="bg-white text-black px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform">
                                                <span className="material-symbols-outlined text-[#10B981]">terminal</span>
                                                Boot Live Environment
                                            </button>
                                        </SignInButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-white/10 bg-[#1C1B1D]">
                    <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                                <span className="material-symbols-outlined text-[#10B981] font-medium" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                                <span className="text-lg font-black tracking-tighter text-white">FocusOrbit</span>
                            </div>
                            <p className="text-sm font-medium text-[#BBCABF]/60 text-center md:text-left max-w-xs">
                                Engineered for developers who demand peak cognitive momentum.
                            </p>
                        </div>
                        
                        <div className="flex gap-12 text-sm font-semibold tracking-wide text-center md:text-left">
                            <div className="flex flex-col gap-4">
                                <span className="text-white uppercase tracking-widest text-[10px]">Product</span>
                                <a className="text-[#BBCABF] hover:text-[#10B981] transition-colors" href="#">Manifesto</a>
                                <a className="text-[#BBCABF] hover:text-[#10B981] transition-colors" href="#">Changelog</a>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-white uppercase tracking-widest text-[10px]">Legal</span>
                                <a className="text-[#BBCABF] hover:text-[#10B981] transition-colors" href="#">Privacy</a>
                                <a className="text-[#BBCABF] hover:text-[#10B981] transition-colors" href="#">Terms</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
