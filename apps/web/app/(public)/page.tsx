import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { HeroHighlight } from '../../components/hero-highlight';
import { BentoGrid, BentoCard } from '../../components/bento-grid';
import { Timeline } from '../../components/timeline';
import { ParallaxCard } from '../../components/parallax-card';
import { FadeIn, TextReveal } from '../../components/animated';

const fitur = [
  {
    icon: '📅',
    judul: 'Jadwal Perkuliahan',
    deskripsi: 'Bagikan jadwal harian langsung di WhatsApp dan jawab “jadwal hari ini?” kapan saja.'
  },
  {
    icon: '📝',
    judul: 'Tugas & Deadline',
    deskripsi: 'Kelola tugas, tenggat, dan pengingat pengumpulan tanpa meninggalkan grup.'
  },
  {
    icon: '👥',
    judul: 'Manajemen Grup',
    deskripsi: 'Sambungkan setiap grup WhatsApp ke kelasnya hanya dengan satu perintah register.'
  },
  {
    icon: '🔔',
    judul: 'Pengingat Pintar',
    deskripsi: 'Aktifkan atau senyapkan pengingat per grup tanpa spam ke seluruh kampus.'
  },
  {
    icon: '🔐',
    judul: 'Login OTP',
    deskripsi: 'Ketua kelas masuk dengan OTP yang dikirim via DM — aman dan bebas kata sandi.'
  }
];

const langkah = [
  {
    title: 'Login dengan OTP',
    content: 'Ketua kelas menerima kode sekali pakai dari Unibot di DM WhatsApp, lalu masuk ke dashboard.'
  },
  {
    title: 'Daftarkan grup kelas',
    content: 'Undang @Unibot ke grup dan jalankan perintah register agar terhubung dengan data kelas.'
  },
  {
    title: 'Mention & langsung jalan',
    content: 'Mahasiswa cukup tag @Unibot untuk cek jadwal, tugas, atau pengingat yang akan datang.'
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
        <div className="absolute left-1/2 top-[-14rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[150px]" />
        <div className="absolute right-[-10%] top-[18rem] hidden h-72 w-72 rounded-full bg-cyan-500/25 blur-[120px] lg:block" />
        <div className="absolute left-[-6%] bottom-[-10rem] h-80 w-80 rounded-full bg-purple-500/25 blur-[130px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-24 px-6 py-16 md:px-12">
        <section className="pt-8 mt-24" id="hero">
          <HeroHighlight>
            <div className="relative grid gap-12 overflow-hidden rounded-[2.4rem] px-10 py-16 sm:px-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="flex flex-col gap-8">
                <FadeIn delay={0.1}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-emerald-500/20">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Unibot</p>
                      <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
                        <TextReveal text="Bot WhatsApp untuk mengelola kelas kamu." />
                      </h1>
                    </div>
                  </div>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <p className="max-w-xl text-lg text-slate-200">
                    Bot WhatsApp untuk mengatur jadwal, tugas, grup, dan pengingat — langsung di percakapan kampus. Unibot
                    hanya merespons saat disebut dan menyimpan OTP khusus di pesan pribadi.
                  </p>
                </FadeIn>
                <FadeIn delay={0.3}>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href="/admin/login"
                      className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_20px_55px_-25px_rgba(16,185,129,0.8)] transition hover:-translate-y-1 hover:bg-emerald-300"
                    >
                      Masuk sebagai Ketua Kelas
                    </Link>
                    <Link
                      href="https://github.com/imyourdream/unibot"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-emerald-300"
                    >
                      GitHub ↗
                    </Link>
                  </div>
                </FadeIn>
              </div>

              <FadeIn delay={0.35}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] border border-white/10" style={{ transform: 'rotate3d(1, 0.3, 0.2, 18deg)' }} />
                  <div className="absolute inset-8 rounded-[2rem] border border-emerald-400/20" style={{ transform: 'rotate3d(1, -0.2, 0.1, -14deg)' }} />
                  <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_35px_120px_-60px_rgba(56,189,248,0.5)]">
                    <header className="flex items-center justify-between text-xs text-slate-400">
                      <span>WA · Informatika 2024</span>
                      <span>09.02</span>
                    </header>
                    <div className="mt-6 space-y-4 text-sm text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Nadia</span>
                        <span className="text-xs text-slate-500">menyebut @Unibot</span>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <p className="text-emerald-300">Unibot</p>
                        <p className="mt-1">Senin · 07.00 - 09.00 · Matematika Diskrit (R.301)</p>
                        <p className="text-xs text-slate-400">Pengingat aktif 30 menit sebelum mulai</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">OTP DM</p>
                        <p className="mt-2 text-slate-200">
                          Kode OTP kamu <span className="font-mono text-emerald-300">319482</span>. Berlaku 3 menit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </HeroHighlight>
        </section>

        <section id="fitur" className="space-y-8">
          <FadeIn>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Fitur Utama</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Semua kebutuhan kelas tersaji dalam satu bot</h2>
              </div>
              <Link
                href="#open-source"
                className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
              >
                Pelajari cara kerja ↓
              </Link>
            </div>
          </FadeIn>
          <BentoGrid>
            {fitur.map((item, index) => (
              <BentoCard
                key={item.judul}
                icon={item.icon}
                title={item.judul}
                description={item.deskripsi}
                index={index}
              />
            ))}
            <BentoCard
              icon="⚙️"
              title="Didukung worker WhatsApp"
              description="Worker Baileys menghormati rate limit, hanya merespons ketika disebut, dan meneruskan logika ke API internal kampus."
              className="xl:col-span-3"
              index={fitur.length}
            >
              <div className="mt-4 grid gap-3 text-xs text-slate-200 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Respon sadar-mention</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Jembatan API internal</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Rate limit in-memory</div>
              </div>
            </BentoCard>
          </BentoGrid>
        </section>

        <section id="cara-kerja" className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <FadeIn>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Alur Singkat</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Mulai dari nol sampai jalan dalam hitungan menit</h2>
                <p className="mt-4 text-sm text-slate-300">
                  Dari login OTP sampai balasan otomatis di grup, Unibot mengikuti pola komunikasi kampus sambil memberi
                  kontrol penuh kepada admin.
                </p>
              </div>
            </FadeIn>
            <Timeline items={langkah} />
          </div>
        </section>

        <section id="demo" className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <ParallaxCard>
            <h2 className="text-2xl font-semibold text-white">Pengalaman obrolan yang terasa natural</h2>
            <p className="mt-2 text-sm text-slate-300">
              Unibot merespons dengan gaya percakapan kampus, menjaga privasi OTP, dan siap menampung intent baru.
            </p>
            <div className="mt-6 space-y-4 text-sm text-slate-100">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-[0_25px_70px_-40px_rgba(129,140,248,0.5)]">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Grup · Sistem Informasi</p>
                <div className="mt-4 space-y-3">
                  <p><span className="font-semibold">Arif:</span> @Unibot tugas minggu ini apa?</p>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                    <p className="text-emerald-300">Unibot</p>
                    <p className="mt-1">Deadline Analisis Data (15 April · 23.59). Unggah di LMS, pengingat aktif 6 jam sebelum.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.5)]">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">DM · OTP</p>
                <p className="mt-3 text-slate-200">Kode OTP kamu <span className="font-mono text-emerald-300">624971</span>. Berlaku 3 menit.</p>
                <p className="text-xs text-slate-500">OTP hanya dikirim via DM — tidak pernah muncul di grup.</p>
              </div>
            </div>
          </ParallaxCard>

          <FadeIn>
            <div className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-semibold text-white">Cuplikan dashboard admin</h2>
              <p className="text-sm text-slate-300">
                Atur jadwal, tugaskan mentor, dan kelola pengingat lewat UI modern berbasis Next.js + Prisma. Seluruh kode
                siap kamu modifikasi.
              </p>
              <div className="relative flex flex-1 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/70 p-6">
                <div className="absolute inset-x-12 top-6 h-24 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_45px_120px_-70px_rgba(16,185,129,0.6)]">
                  <header className="flex items-center justify-between text-xs text-slate-400">
                    <span>Dashboard · Ketua</span>
                    <span>Asia/Jakarta</span>
                  </header>
                  <ul className="mt-5 space-y-3 text-sm text-slate-200">
                    <li className="flex items-center justify-between rounded-xl bg-emerald-400/10 px-3 py-2">
                      <span>Matematika Diskrit</span>
                      <span className="text-xs text-emerald-200">07.00</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <span>Workshop UI/UX</span>
                      <span className="text-xs text-slate-400">10.30</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                      <span>Reminder Analisis Data</span>
                      <span className="text-xs text-slate-400">6 jam sebelum</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        <section id="open-source" className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <FadeIn>
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Open Source</p>
                <h2 className="text-3xl font-semibold text-white">Lisensi MIT, digerakkan komunitas.</h2>
                <p className="text-sm text-slate-300">
                  Fork repositori, deploy monorepo ini, dan sesuaikan untuk kebutuhan kampusmu. Packages bersama, worker Baileys,
                  dan aplikasi Next.js siap dikembangkan bersama.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300/90">
                    MIT License
                  </span>
                  <Link
                    href="https://github.com/imyourdream/unibot"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-300 hover:text-emerald-300"
                  >
                    Lihat Repository
                  </Link>
                  <Link
                    href="https://github.com/imyourdream/unibot/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-300 hover:bg-white/10"
                  >
                    Ikut Kontribusi
                  </Link>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="relative">
                <div className="absolute inset-0 rounded-[2.5rem] border border-white/10" style={{ transform: 'rotate3d(1, 0.3, 0.2, 20deg)' }} />
                <div className="absolute inset-6 rounded-[2.5rem] border border-emerald-400/20" style={{ transform: 'rotate3d(1, -0.2, 0.1, -12deg)' }} />
                <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-10 text-center shadow-[0_35px_120px_-65px_rgba(16,185,129,0.6)]">
                  <p className="text-sm text-slate-300">
                    “Kami membangun Unibot agar tiap kampus bisa punya otomasi sendiri — tanpa vendor lock-in, cukup
                    TypeScript dan API terbuka.”
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-10 text-sm text-slate-400">
          <FadeIn>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p>© {new Date().getFullYear()} Unibot. Dibuat untuk otomasi akademik modern.</p>
              <nav className="flex flex-wrap items-center gap-4">
                <Link
                  href="https://github.com/imyourdream/unibot"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-emerald-300"
                >
                  GitHub
                </Link>
                <Link href="#fitur" className="transition hover:text-emerald-300">
                  Dokumentasi
                </Link>
                <Link href="mailto:hello@unibot.com" className="transition hover:text-emerald-300">
                  Kontak
                </Link>
              </nav>
            </div>
          </FadeIn>
        </footer>
      </div>
    </main>
  );
}
