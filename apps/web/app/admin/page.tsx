import Link from 'next/link';

import { getSession } from '../../lib/session';

export default async function AdminDashboardPage() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 text-slate-900">
      <header className="space-y-2">
        <p className="text-sm font-medium text-emerald-600">Hai, Ketua Kelas 👋</p>
        <h1 className="text-3xl font-semibold">Dashboard Unibot</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Kelola jadwal, tugas, dan koneksi grup WhatsApp kamu. Kami akan segera menambahkan aksi lanjutan — sementara ini,
          kamu bisa mengecek data yang sudah tersinkron dan mempersiapkan reminder.
        </p>
        <p className="text-xs text-slate-500">
          Masuk sebagai: <span className="font-mono">{session.phoneNumber ?? '—'}</span>
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Jadwal Kuliah</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tambahkan atau sesuaikan jadwal mingguan kelas. Unibot akan mengirim reminder sesuai slot waktu yang kamu atur.
          </p>
          <div className="mt-4 text-sm text-emerald-600">Segera hadir.</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tugas &amp; Deadline</h2>
          <p className="mt-2 text-sm text-slate-600">
            Kelola daftar tugas dan tenggat penting, lalu aktifkan pengingat otomatis ke grup WhatsApp kelas.
          </p>
          <div className="mt-4 text-sm text-emerald-600">Segera hadir.</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Koneksi Grup</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pastikan setiap kelas sudah terhubung dengan grup WhatsApp melalui perintah <span className="font-mono">@unibot register</span>.
          </p>
          <div className="mt-4 text-sm text-emerald-600">Log integrasi akan muncul di sini.</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Resource Lain</h2>
          <p className="mt-2 text-sm text-slate-600">
            Baca dokumentasi arsitektur dan kontribusi ke proyek open-source Unibot.
          </p>
          <Link
            href="https://github.com/imyourdream/unibot"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-500"
          >
            Lihat GitHub ↗
          </Link>
        </article>
      </section>
    </main>
  );
}
