'use client';

import { useMotionTemplate, useMotionValue, motion } from 'framer-motion';
import { type ReactNode } from 'react';

export function ParallaxCard({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, rgba(16,185,129,0.35), transparent 60%)`;

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const posX = event.clientX - rect.left;
    const posY = event.clientY - rect.top;
    x.set(posX);
    y.set(posY);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rotateX.set(((posY - centerY) / centerY) * -6);
    rotateY.set(((posX - centerX) / centerX) * 6);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
      style={{ rotateX, rotateY, background }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="relative rounded-3xl border border-white/5 bg-slate-950/80 p-8">
        {children}
      </div>
    </motion.div>
  );
}
