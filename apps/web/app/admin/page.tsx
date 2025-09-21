import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { hasActiveSession } from '../../lib/auth';
import { getSession } from '../../lib/session';
import { WEEKDAY_LABELS } from '../../lib/weekdays';
import type { AdminClass, AdminDashboardResponse } from './types';
import ScheduleManager from './_components/schedule-manager';

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!hasActiveSession(session) || !session.userId) {
    redirect('/admin/login');
  }

  const data = await loadDashboardData();
  const adminClasses: AdminClass[] = data.classes;

  const classCountLabel = data.stats.classCount.toLocaleString('id-ID');
  const totalSchedulesLabel = data.stats.totalSchedules.toLocaleString('id-ID');
  const upcoming = data.upcoming;

  const upcomingTitle = upcoming ? upcoming.schedule.title ?? 'Tanpa judul' : 'Belum ada jadwal';
  const upcomingMeta = upcoming
    ? `${upcoming.className} · ${WEEKDAY_LABELS[upcoming.schedule.dayOfWeek].label}, ${formatTimeRange(
        upcoming.schedule.startTime,
        upcoming.schedule.endTime
      )}`
    : 'Tambahkan jadwal untuk menyiapkan pengingat otomatis.';

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16 md:px-12">
      <header className="space-y-8">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Dashboard</p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Hai, Ketua Kelas 👋</h1>
              <p className="text-sm text-slate-300">
                Kelola jadwal mingguan kelas kamu, siapkan pengingat otomatis, dan pantau integrasi dengan grup WhatsApp.
                Semua aksi akan segera terhubung langsung dengan Unibot di percakapan kampus.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://github.com/imyourdream/unibot"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                >
                  GitHub & Dokumentasi ↗
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xs text-slate-300 shadow-[0_25px_70px_-45px_rgba(56,189,248,0.55)]">
              <p className="uppercase tracking-[0.3em] text-emerald-300/70">Masuk sebagai</p>
              <p className="mt-3 font-mono text-sm text-white">{session.phoneNumber ?? '—'}</p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Kelas Aktif"
            value={classCountLabel}
            description="Jumlah kelas yang terhubung dengan akun kamu."
          />
          <StatCard
            label="Slot Jadwal"
            value={totalSchedulesLabel}
            description="Total jadwal mingguan yang akan diingatkan oleh Unibot."
          />
          <StatCard label="Jadwal Terdekat" value={upcomingTitle} description={upcomingMeta} variant="accent" />
        </section>
      </header>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Kelola Jadwal Kelas</h2>
          <p className="mt-2 text-sm text-slate-300">
            Tambahkan, ubah, atau hapus jadwal kuliah. Unibot akan mengirim pengingat sesuai jam yang kamu atur di sini.
          </p>
        </div>

        <ScheduleManager classes={adminClasses} />
      </section>
    </main>
  );
}
function formatTimeRange(start: string, end: string) {
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
}

function formatTimeLabel(value: string) {
  return value?.slice(0, 5) ?? value;
}

async function loadDashboardData(): Promise<AdminDashboardResponse> {
  const headerList = headers();
  const protocol =
    headerList.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const host = headerList.get('host');

  if (!host) {
    throw new Error('Host header is missing');
  }

  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const response = await fetch(`${protocol}://${host}/api/admin/dashboard`, {
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (response.status === 401) {
    redirect('/admin/login');
  }

  if (!response.ok) {
    throw new Error('Gagal memuat data dashboard.');
  }

  return (await response.json()) as AdminDashboardResponse;
}

function StatCard({
  label,
  value,
  description,
  variant = 'default'
}: {
  label: string;
  value: string;
  description: string;
  variant?: 'default' | 'accent';
}) {
  return (
    <article
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(6,182,212,0.45)] ${
        variant === 'accent' ? 'bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-transparent' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">{label}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </article>
  );
}
