'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'otp';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setDebugOtp(null);

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });

      const data = (await response.json()) as { error?: string; message?: string; debug?: { code?: string } };

      if (!response.ok) {
        setError(data.error ?? 'Gagal mengirim OTP. Coba lagi.');
        return;
      }

      setInfo(data.message ?? 'Kode OTP telah dikirim.');
      setStep('otp');

      if (data.debug?.code) {
        setDebugOtp(data.debug.code);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ phone, code: otp })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Kode OTP salah atau kedaluwarsa.');
        return;
      }

      setInfo('Berhasil masuk. Mengalihkan ke dashboard…');
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-[0_35px_120px_-60px_rgba(16,185,129,0.65)]">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.45em] text-emerald-300/80">Unibot</p>
          <h1 className="text-2xl font-semibold">Portal Ketua Kelas</h1>
          <p className="text-sm text-slate-300">
            Masuk dengan nomor WhatsApp yang terdaftar sebagai admin kelas. Kami akan mengirim OTP melalui DM.
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-200">
                Nomor WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}
            {info && <p className="text-sm text-emerald-300">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-[2px] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Mengirim OTP…' : 'Kirim OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-slate-200">
                Masukkan OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="tracking-[0.4em] w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-center text-lg font-semibold text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
              />
              <p className="text-xs text-slate-400">Kode berlaku selama 3 menit. Kirim ulang jika belum menerima.</p>
            </div>

            {debugOtp && (
              <p className="text-xs text-emerald-300/80">
                <span className="font-semibold">Debug:</span> kode <span className="font-mono">{debugOtp}</span>
              </p>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
            {info && <p className="text-sm text-emerald-300">{info}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-[2px] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memverifikasi…' : 'Masuk ke Dashboard'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setInfo(null);
                setError(null);
              }}
              className="w-full text-center text-xs font-medium text-slate-400 underline underline-offset-4 transition hover:text-slate-200"
            >
              Ganti nomor WhatsApp
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
