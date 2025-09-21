import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[160px]" />
        <div className="absolute right-[-18%] top-[22rem] hidden h-80 w-80 rounded-full bg-cyan-500/20 blur-[140px] lg:block" />
        <div className="absolute left-[-10%] bottom-[-8rem] h-72 w-72 rounded-full bg-purple-500/15 blur-[140px]" />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
