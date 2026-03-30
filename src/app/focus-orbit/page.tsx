'use client';
import { useFocusStore } from '@/store/useFocusStore';
import { IdeWorkspace } from '@/components/focus-orbit/IdeWorkspace';
import Link from 'next/link';

export default function FocusOrbitPage() {
    const { isDeepFocus, toggleDeepFocus } = useFocusStore();

    if (isDeepFocus) {
        return <IdeWorkspace />;
    }

    return (
        <div className="selection:bg-primary/30 selection:text-primary max-w-[100vw] overflow-x-hidden min-h-screen">
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-emerald-500/5">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tighter text-white">FocusOrbit</span>
                        <div className="hidden md:flex items-center gap-6 font-inter tracking-tight text-sm font-medium">
                            <a className="text-slate-400 hover:text-white transition-colors" href="#">Product</a>
                            <a className="text-slate-400 hover:text-white transition-colors" href="#">Solutions</a>
                            <a className="text-slate-400 hover:text-white transition-colors" href="#">Pricing</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleDeepFocus}
                            className="primary-gradient text-on-primary font-medium px-5 py-2 rounded-lg text-sm transition-all duration-300 hover:brightness-110 active:scale-95">
                            Start Focusing
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20">
                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center px-6 mb-32">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant">Version 2.0 Now Live</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
                        Master Your <span className="text-primary">90-Day</span> Journey
                    </h1>
                    <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
                        A high-precision environment engineered for deep work. Navigate complex projects with the clarity of a celestial architect.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={toggleDeepFocus}
                            className="primary-gradient w-full sm:w-auto text-on-primary font-semibold px-8 py-4 rounded-lg text-base hover:brightness-110 transition-all active:scale-95">
                            Start Focusing
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">play_circle</span>
                            Watch Demo
                        </button>
                    </div>
                </section>

                {/* Visual Anchor Image */}
                <section className="max-w-6xl mx-auto px-6 mb-40">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 shadow-2xl">
                            <img 
                                className="w-full h-full object-cover opacity-80" 
                                alt="Modern minimalist workspace" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsHpgOwd3rGKbxH4iG-dZAp0DUXLpe8aGjr5np046yxk3hDQ-dgNrgROuxLorZAXhUfPO4kxUuotpn-RbxIqmG3O3otJkg2M-6ybC8Pq96MDtsKIQxXG349fqcJhNsb2LX9D2ZE_8K9ey2NmWqk7SO7fPncBEQTW8Cy4y4LQ_-YI4bYyBHVNHyHUmr7E9_e9MJDG_hCx-zTO2ahc4UhB05_EM9N0sqolvxH-uyLltZTyCaLDlcTggQE2SYgqSQddRSlqAYgWecbQ"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                        </div>
                    </div>
                </section>

                {/* Bento Grid Features */}
                <section className="max-w-7xl mx-auto px-6 mb-40">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Feature A: Pomodoro */}
                        <div className="md:col-span-4 bg-surface-container-low p-8 rounded-2xl border border-transparent hover:border-outline-variant/20 transition-all duration-300 group">
                            <div className="h-12 w-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">timer</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Visual Pomodoro</h3>
                            <div className="relative h-48 flex items-center justify-center mb-6">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"></circle>
                                    <circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="110" strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">25:00</span>
                                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Focus Phase</span>
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">Precision timing blocks designed to protect your flow state from external noise.</p>
                        </div>

                        {/* Feature B: 90-Day Tracker */}
                        <div className="md:col-span-8 bg-surface-container-low p-8 rounded-2xl border border-transparent hover:border-outline-variant/20 transition-all duration-300">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="h-12 w-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6 text-primary">
                                        <span className="material-symbols-outlined">query_stats</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">90-Day Progress Tracker</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-primary">84%</span>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Completion Rate</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="h-32 flex items-end justify-between gap-2 px-2">
                                    <div className="w-full bg-primary/20 h-[40%] rounded-t-sm"></div>
                                    <div className="w-full bg-primary/40 h-[60%] rounded-t-sm"></div>
                                    <div className="w-full bg-primary/30 h-[45%] rounded-t-sm"></div>
                                    <div className="w-full bg-primary/60 h-[75%] rounded-t-sm"></div>
                                    <div className="w-full bg-primary h-full rounded-t-sm shadow-[0_0_20px_rgba(78,222,163,0.3)]"></div>
                                    <div className="w-full bg-primary/40 h-[55%] rounded-t-sm"></div>
                                    <div className="w-full bg-primary/20 h-[30%] rounded-t-sm"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-label text-on-surface-variant uppercase tracking-widest border-t border-outline-variant/10 pt-4">
                                    <span>Month 1</span>
                                    <span>Month 2</span>
                                    <span>Month 3 (Active)</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature C: AI Prioritization */}
                        <div className="md:col-span-12 lg:col-span-12 bg-surface-container-low p-8 rounded-2xl border border-transparent hover:border-outline-variant/20 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="max-w-md">
                                    <div className="h-12 w-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6 text-primary">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4">AI-Powered Prioritization</h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">Our neural engine analyzes your backlog to surface the one task that moves the needle. No more decision fatigue.</p>
                                    <button className="text-primary text-sm font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                                        Explore the engine
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                                <div className="flex-1 w-full space-y-3">
                                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/10 flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                                            <span className="text-sm text-on-surface">Architectural System Design</span>
                                        </div>
                                        <span className="px-2 py-1 rounded-md bg-primary/10 text-[10px] text-primary font-bold uppercase tracking-wider">High Impact</span>
                                    </div>
                                    <div className="bg-surface/50 p-4 rounded-xl border border-outline-variant/5 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                                            <span className="text-sm text-on-surface">Refactor Legacy Modules</span>
                                        </div>
                                        <span className="px-2 py-1 rounded-md bg-surface-container-highest text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Scheduled</span>
                                    </div>
                                    <div className="bg-surface/50 p-4 rounded-xl border border-outline-variant/5 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                                            <span className="text-sm text-on-surface">Weekly Team Sync</span>
                                        </div>
                                        <span className="px-2 py-1 rounded-md bg-surface-container-highest text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Routine</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Code Snippet Section */}
                <section className="max-w-5xl mx-auto px-6 mb-40">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Built for Architects</h2>
                        <p className="text-on-surface-variant">Integrate FocusOrbit directly into your existing CI/CD and engineering workflows.</p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-3xl">
                        <div className="bg-surface-container-high px-6 py-3 flex items-center gap-2 border-b border-outline-variant/10">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                            </div>
                            <span className="ml-4 text-[11px] font-mono text-on-surface-variant">integration_schema.ts</span>
                        </div>
                        <div className="p-8 font-mono text-sm leading-relaxed overflow-x-auto">
                            <pre className="text-on-surface-variant"><span className="text-emerald-400">import</span> {"{ OrbitEngine }"} <span className="text-emerald-400">from</span> <span className="text-amber-200">'@focus-orbit/sdk'</span>;
<br/>
<span className="text-emerald-400">const</span> architect = <span className="text-emerald-400">new</span> OrbitEngine({"{ "}
  apiKey: process.env.FOCUS_ORBIT_KEY,
  priorityMode: <span className="text-amber-200">'aggressive'</span>
{"}"});
<br/>
<span className="text-slate-500">// Define your 90-day focus trajectory</span>
<span className="text-emerald-400">await</span> architect.createSprint({"{ "}
  title: <span className="text-amber-200">"Modern Architecture V3"</span>,
  duration: <span className="text-primary">90</span>,
  metrics: [<span className="text-amber-200">"code_quality"</span>, <span className="text-amber-200">"flow_state"</span>],
  autoPrioritize: <span className="text-emerald-400">true</span>
{"}"});</pre>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-5xl mx-auto px-6 mb-20">
                    <div className="relative bg-surface-container-low rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-primary/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight relative z-10">
                            Ready to reclaim your <span className="text-primary">focus</span>?
                        </h2>
                        <p className="text-on-surface-variant max-w-xl mx-auto mb-10 text-lg relative z-10">
                            Join over 40,000+ engineers and architects who have optimized their deep work rituals with FocusOrbit.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <button 
                                onClick={toggleDeepFocus}
                                className="primary-gradient w-full sm:w-auto px-10 py-5 rounded-xl font-bold text-on-primary text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                Get Started Free
                            </button>
                            <span className="text-on-surface-variant text-sm font-medium">No credit card required.</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-12 border-t border-white/5 bg-surface">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="text-lg font-black text-white">FocusOrbit</span>
                        <p className="font-inter text-xs tracking-widest uppercase text-slate-500">© 2024 FocusOrbit. Precision for the modern architect.</p>
                    </div>
                    <div className="flex gap-8">
                        <a className="font-inter text-xs tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors opacity-80 hover:opacity-100" href="#">GitHub</a>
                        <a className="font-inter text-xs tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors opacity-80 hover:opacity-100" href="#">LinkedIn</a>
                        <a className="font-inter text-xs tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors opacity-80 hover:opacity-100" href="#">Privacy</a>
                        <a className="font-inter text-xs tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors opacity-80 hover:opacity-100" href="#">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
