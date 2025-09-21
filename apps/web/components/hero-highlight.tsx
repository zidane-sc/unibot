'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function HeroHighlight({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.3 }}
      className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-tr from-white/5 via-white/0 to-white/5 p-[1px]"
    >
      <div className="relative rounded-[2.4rem] bg-slate-950/90">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          initial={{ rotate: -6 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute left-1/2 top-[-18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/35 blur-[140px]"
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-10%] bottom-10 h-72 w-72 rounded-full bg-cyan-500/25 blur-[120px]"
            animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[-4%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[120px]"
            animate={{ x: [0, 15, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        {children}
      </div>
    </motion.div>
  );
}
