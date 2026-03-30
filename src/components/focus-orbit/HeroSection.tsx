'use client';

import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center pt-32 pb-16 text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl mx-auto flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium rounded-full bg-surface-low text-primary-container border border-surface-high/30 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Deep Focus Mode Integrated
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          Master Your <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">
            90-Day Journey
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-on-surface-variant text-lg md:text-xl mb-12">
          The ultimate productivity environment. Combining elite task prioritization with an immersive, distraction-free IDE workspace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 font-semibold text-surface bg-gradient-to-br from-primary to-primary-container rounded-md hover:brightness-110 transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            Start Your Orbit
          </button>
          <button className="w-full sm:w-auto px-8 py-4 font-semibold text-white bg-surface-low rounded-md hover:bg-surface-high transition-colors border border-surface-high/50">
            View Documentation
          </button>
        </div>
      </motion.div>
    </section>
  );
}
