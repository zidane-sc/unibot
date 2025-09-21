import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';

const features = [
  {
    icon: '📅',
    title: 'Class Schedule',
    description: 'Drop schedules into WhatsApp and let Unibot answer “jadwal hari ini?” instantly.'
  },
  {
    icon: '📝',
    title: 'Assignments & Deadlines',
    description: 'Track tasks, due dates, and submissions without leaving your group chat.'
  },
  {
    icon: '👥',
    title: 'Group Management',
    description: 'Map every WhatsApp group to the right class with a single register command.'
  },
  {
    icon: '🔔',
    title: 'Smart Reminders',
    description: 'Mute or unmute reminders per group, all handled by the worker — no spam broadcasts.'
  },
  {
    icon: '🔐',
    title: 'OTP Login',
    description: 'Verify Ketua and admins with secure OTP flows delivered via direct message.'
  }
];

const steps = [
  {
    step: '01',
    heading: 'Login with OTP',
    description: 'Ketua kelas authenticates with a single-use code — no passwords required.'
  },
  {
    step: '02',
    heading: 'Register Your Group',
    description: 'Invite @Unibot, run the register command, and link the group to its class.'
  },
  {
    step: '03',
    heading: 'Mention & Go',
    description: 'Members tag @Unibot to request schedules, tasks, and future reminders in real time.'
  }
];

export default async function PublicLandingPage() {
  const session = await getSession();

  if (session?.userId) {
    redirect('/admin');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
          style={{ filter: 'blur(120px)' }}
        />
        <div
          className="absolute right-[10%] top-[30%] hidden h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl md:block"
          aria-hidden
          style={{ transform: 'rotate3d(1, 1, 0, 35deg)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute left-[8%] bottom-[-4rem] h-60 w-60 rounded-full bg-purple-500/30 blur-3xl"
          aria-hidden
          style={{ transform: 'rotate3d(0.2, 1, 0.1, 45deg)', filter: 'blur(100px)' }}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-24 px-6 py-16 md:px-12">
        <header className="relative flex flex-col gap-12 pt-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-emerald-500/10">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Unibot</p>
                <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                  WhatsApp bot to manage your class.
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/imyourdream/unibot"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-300 hover:text-emerald-300"
                target="_blank"
                rel="noreferrer"
              >
                GitHub ↗
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow-[0_20px_45px_-20px_rgba(16,185,129,0.7)] transition hover:-translate-y-1 hover:bg-emerald-300"
              >
                Login as Ketua Kelas
              </Link>
            </div>
          </div>

          <p className="max-w-3xl text-lg text-slate-200">
            Manage schedules, assignments, group access, and reminders — right inside your WhatsApp chat. Unibot keeps
            conversations flowing while the web dashboard handles admin superpowers.
          </p>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1">
            <div className="absolute inset-x-10 top-10 h-32 rounded-full bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-purple-500/30 blur-3xl" />
            <div className="relative flex flex-col gap-6 rounded-[calc(theme(borderRadius.3xl)-4px)] bg-slate-950/90 px-8 py-12 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-white">
                  “Schedules, tasks, and mentions finally live in one place.”
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  The worker listens for @Unibot mentions, replies in real time, and keeps DMs for OTP only — exactly how
                  your class expects it.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center">
                  <span className="text-xl font-semibold text-emerald-300">24/7</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">WA support</span>
                </div>
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center">
                  <span className="text-xl font-semibold text-emerald-300">OTP</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="features">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_-40px_rgba(45,212,191,0.6)] transition hover:-translate-y-1 hover:border-emerald-300/80"
            >
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
              <div className="pointer-events-none absolute -right-12 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl group-hover:block" />
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-3" id="how-it-works">
          {steps.map((step) => (
            <article
              key={step.heading}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/5 p-8"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-300/80">{step.step}</span>
              <h4 className="mt-4 text-lg font-semibold text-white">{step.heading}</h4>
              <p className="mt-3 text-sm text-slate-300">{step.description}</p>
              <div className="pointer-events-none absolute -bottom-16 right-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
            </article>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]" id="demo">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-semibold text-white">WhatsApp in action</h2>
            <p className="mt-2 text-sm text-slate-300">
              Preview how @Unibot handles daily requests without breaking the group flow.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-slate-950/80 p-6 shadow-lg shadow-emerald-500/10">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Group Chat · Informatika 2024</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <p><span className="font-semibold text-white">Nadia:</span> @Unibot jadwal hari ini dong</p>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-emerald-300">Unibot</p>
                    <p className="mt-1 text-slate-100">Senin · 07.00 - 09.00 · Matematika Diskrit (R.301)</p>
                    <p className="text-xs text-slate-400">Reminder aktif 30 menit sebelum mulai</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/80 p-6 shadow-lg shadow-cyan-500/10">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Direct Message · OTP</p>
                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <p><span className="font-semibold text-white">Unibot:</span> Kode OTP kamu <span className="font-mono text-emerald-300">319482</span>. Berlaku 3 menit.</p>
                  <p className="text-xs text-slate-500">– DM otomatis, no spam.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div>
              <h2 className="text-2xl font-semibold text-white">Admin Dashboard</h2>
              <p className="mt-2 text-sm text-slate-300">
                Customize schedules, publish assignments, and monitor groups from a clean dashboard UI.
              </p>
            </div>
            <div className="relative flex flex-1 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/70">
              <div className="absolute inset-x-12 top-6 h-24 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-emerald-500/10">
                <header className="flex items-center justify-between text-xs text-slate-400">
                  <span>Class Planner</span>
                  <span>Today · 07:00</span>
                </header>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                    <span>Matematika Diskrit</span>
                    <span className="text-xs text-emerald-200">07:00</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>Algoritma & Struktur Data</span>
                    <span className="text-xs text-slate-400">09:30</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>Praktikum Basdat</span>
                    <span className="text-xs text-slate-400">13:00</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-8" id="open-source">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Open Source</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Built in the open, shaped by the community</h2>
              <p className="mt-3 text-sm text-slate-300">
                Unibot ships with an MIT license. Fork it, extend it, and deploy for your campus. Contributions for new
                intents, reminder jobs, or dashboards are always welcome.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300/90">
                  MIT License
                </span>
                <Link
                  href="https://github.com/imyourdream/unibot"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-300 hover:text-emerald-300"
                >
                  View Repository
                </Link>
                <Link
                  href="https://github.com/imyourdream/unibot/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-300 hover:bg-white/10"
                >
                  Contribute
                </Link>
              </div>
            </div>
            <div className="relative flex h-48 w-full max-w-sm items-center justify-center md:h-56">
              <div className="absolute inset-0 rounded-3xl border border-white/10 bg-white/5" style={{ transform: 'rotate3d(1, 0.2, 0.1, 18deg)' }} />
              <div className="absolute inset-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10" style={{ transform: 'rotate3d(1, -0.3, 0, -10deg)' }} />
              <div className="relative z-10 rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-8 text-center shadow-[0_30px_80px_-40px_rgba(16,185,129,0.5)]">
                <p className="text-sm text-slate-300">“We designed Unibot so every campus can run their own automation stack — no vendor lock-in.”</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-10 text-sm text-slate-400">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p>© {new Date().getFullYear()} Unibot. Crafted for modern academic automation.</p>
            <nav className="flex flex-wrap items-center gap-4">
              <Link
                href="https://github.com/imyourdream/unibot"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-emerald-300"
              >
                GitHub
              </Link>
              <Link href="#features" className="transition hover:text-emerald-300">
                Docs
              </Link>
              <Link href="mailto:hello@unibot.com" className="transition hover:text-emerald-300">
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
