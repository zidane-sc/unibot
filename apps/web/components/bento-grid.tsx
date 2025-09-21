'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export function BentoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-component="bento-grid">
      {children}
    </div>
  );
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 }
};

export function BentoCard({
  title,
  icon,
  description,
  className,
  children,
  index
}: {
  title: string;
  icon?: ReactNode;
  description: string;
  className?: string;
  children?: ReactNode;
  index?: number;
}) {
  return (
    <motion.article
      variants={cardVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: (index ?? 0) * 0.05 }}
      whileHover={{ y: -8, rotateX: 1, rotateY: -1, transition: { duration: 0.25 } }}
      className={clsx(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_35px_70px_-50px_rgba(56,189,248,0.45)]',
        className
      )}
    >
      <motion.div
        aria-hidden
        className="text-2xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      {children ? <div className="mt-5 text-sm text-slate-200">{children}</div> : null}
      <div className="pointer-events-none absolute -right-12 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl group-hover:block" />
    </motion.article>
  );
}
