'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export type TimelineItem = {
  title: string;
  subtitle?: string;
  content: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-8 before:absolute before:inset-y-0 before:left-[18px] before:w-px before:bg-gradient-to-b before:from-emerald-400/50 before:via-slate-700/40 before:to-transparent">
      {items.map((item, idx) => (
        <motion.li
          key={item.title}
          className="relative pl-16"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
        >
          <motion.div
            className={clsx(
              'absolute left-0 top-1 h-8 w-8 -translate-x-1/2 rounded-full border border-emerald-400/60 bg-slate-950/90 shadow-[0_0_0_4px_rgba(15,23,42,1)]'
            )}
            animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0 4px rgba(15,23,42,1)', '0 0 0 6px rgba(16,185,129,0.35)', '0 0 0 4px rgba(15,23,42,1)'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/90">Langkah {idx + 1}</p>
            <h4 className="mt-3 text-lg font-semibold text-white">{item.title}</h4>
            {item.subtitle ? <p className="text-sm text-emerald-300/80">{item.subtitle}</p> : null}
            <p className="mt-3 text-sm text-slate-300">{item.content}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
