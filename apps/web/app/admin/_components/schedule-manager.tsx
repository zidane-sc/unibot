'use client';

import Link from 'next/link';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { WEEKDAYS, WEEKDAY_LABELS, sortByWeekdayAndStartTime } from '../../../lib/weekdays';
import type { AdminClass, ScheduleRecord } from '../types';

type FormState = {
  title: string;
  description: string;
  room: string;
  hints: string;
  dayOfWeek: (typeof WEEKDAYS)[number];
  startTime: string;
  endTime: string;
};

type StatusState = { type: 'success' | 'error'; message: string } | null;

function createEmptyForm(overrides?: Partial<FormState>): FormState {
  return {
    title: '',
    description: '',
    room: '',
    hints: '',
    dayOfWeek: WEEKDAYS[0],
    startTime: '07:00',
    endTime: '09:00',
    ...overrides
  };
}

function parseHintsInput(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  const seen = new Set<string>();
  const hints: string[] = [];

  for (const segment of value.split(',')) {
    const hint = segment.trim().toLowerCase();

    if (!hint || seen.has(hint)) {
      continue;
    }

    seen.add(hint);
    hints.push(hint);
  }

  return hints;
}

export default function ScheduleManager({ classes }: { classes: AdminClass[] }) {
  const [classState, setClassState] = useState<AdminClass[]>(classes);
  const [selectedClassId, setSelectedClassId] = useState(() => classes[0]?.id ?? '');
  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>(null);

  const selectedClass = useMemo(
    () => classState.find((item) => item.id === selectedClassId),
    [classState, selectedClassId]
  );

  const groupedSchedules = useMemo(() => {
    if (!selectedClass) {
      return [] as Array<{ day: (typeof WEEKDAYS)[number]; items: ScheduleRecord[] }>;
    }

    return WEEKDAYS.map((day) => ({
      day,
      items: selectedClass.schedules
        .filter((schedule) => schedule.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    })).filter((group) => group.items.length > 0);
  }, [selectedClass]);

  const canManage = Boolean(selectedClass);
  const publicHref = selectedClass ? `/classes/${selectedClass.id}` : null;

  const handleSelectClass = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(event.target.value);
    setMode('create');
    setEditingId(null);
    setForm((previous) => createEmptyForm({ dayOfWeek: previous.dayOfWeek }));
    setStatus(null);
  };

  const handleEdit = (schedule: ScheduleRecord) => {
    setMode('edit');
    setEditingId(schedule.id);
    setForm({
      title: schedule.title ?? '',
      description: schedule.description ?? '',
      room: schedule.room ?? '',
      hints: schedule.hints.join(', '),
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    });
    setStatus(null);
  };

  const handleCancelEdit = () => {
    setMode('create');
    setEditingId(null);
    setForm((previous) => createEmptyForm({ dayOfWeek: previous.dayOfWeek }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClass) {
      setStatus({ type: 'error', message: 'Pilih kelas terlebih dahulu.' });
      return;
    }

    if (mode === 'edit' && !editingId) {
      setStatus({ type: 'error', message: 'Data jadwal tidak ditemukan.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      room: form.room.trim(),
      hints: parseHintsInput(form.hints),
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime
    } as Record<string, unknown>;

    if (!payload.description) {
      delete payload.description;
    }

    if (!payload.room) {
      delete payload.room;
    }

    if (Array.isArray(payload.hints) && (payload.hints as string[]).length === 0) {
      payload.hints = [];
    }

    try {
      const response = await fetch(
        mode === 'create'
          ? `/api/admin/classes/${selectedClass.id}/schedules`
          : `/api/admin/schedules/${editingId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = (await response.json().catch(() => ({}))) as {
        schedule?: ScheduleRecord;
        error?: string;
      };

      if (!response.ok || !data.schedule) {
        setStatus({
          type: 'error',
          message: data.error ?? 'Gagal menyimpan jadwal. Coba lagi.'
        });
        return;
      }

      const savedSchedule = data.schedule;
      const targetClassId = savedSchedule.classId;

      setClassState((current) =>
        current.map((item) => {
          if (mode === 'create') {
            if (item.id !== targetClassId) {
              return item;
            }

            return {
              ...item,
              schedules: [...item.schedules, savedSchedule].sort(sortByWeekdayAndStartTime)
            };
          }

          const containsSchedule = item.schedules.some((existing) => existing.id === savedSchedule.id);

          if (!containsSchedule) {
            return item;
          }

          return {
            ...item,
            schedules: item.schedules
              .map((existing) => (existing.id === savedSchedule.id ? savedSchedule : existing))
              .sort(sortByWeekdayAndStartTime)
          };
        })
      );

      setStatus({
        type: 'success',
        message: mode === 'create' ? 'Jadwal berhasil ditambahkan.' : 'Jadwal berhasil diperbarui.'
      });

      if (mode === 'create') {
        setForm(
          createEmptyForm({
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            hints: form.hints
          })
        );
      } else {
        handleCancelEdit();
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const confirmed = window.confirm('Hapus jadwal ini? Pengingat yang terkait juga akan dihentikan.');

    if (!confirmed) {
      return;
    }

    if (mode === 'edit' && editingId === scheduleId) {
      handleCancelEdit();
    }

    setDeletingId(scheduleId);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        classId?: string;
      };

      if (!response.ok || data.ok !== true) {
        setStatus({ type: 'error', message: data.error ?? 'Gagal menghapus jadwal.' });
        return;
      }

      const targetClassId = data.classId;

      setClassState((current) =>
        current.map((item) => {
          if (targetClassId && item.id !== targetClassId) {
            return item;
          }

          const filtered = item.schedules.filter((schedule) => schedule.id !== scheduleId);

          if (filtered.length === item.schedules.length) {
            return item;
          }

          return {
            ...item,
            schedules: filtered
          };
        })
      );

      setStatus({ type: 'success', message: 'Jadwal berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_35px_120px_-70px_rgba(56,189,248,0.55)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Pilih Kelas</h3>
          <p className="text-sm text-slate-300">Ganti kelas untuk melihat jadwal yang terhubung.</p>
        </div>
        {classState.length > 0 ? (
          <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
            <select
              value={selectedClassId}
              onChange={handleSelectClass}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 md:w-64"
            >
              {classState.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? 'Kelas tanpa nama'}
                </option>
              ))}
            </select>
            {publicHref ? (
              <Link
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 md:self-end"
              >
                Lihat halaman publik ↗
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
            Belum ada kelas terhubung.
          </div>
        )}
      </div>

      {classState.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-10 text-center text-slate-300">
          <p className="text-lg font-semibold text-white">Belum ada kelas yang terhubung</p>
          <p className="mt-3 text-sm">
            Hubungi tim akademik untuk memastikan data kelas kamu sudah terdaftar dan terhubung dengan grup WhatsApp.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Jadwal Mingguan</h4>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-emerald-200">
                {selectedClass?.schedules.length ?? 0} slot
              </span>
            </div>

            {groupedSchedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-300">
                <p className="text-sm">Belum ada jadwal untuk kelas ini. Tambahkan jadwal pertama melalui formulir di samping.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedSchedules.map((group) => (
                  <section key={group.day} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <header className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                          {WEEKDAY_LABELS[group.day].short}
                        </span>
                        <span className="text-sm text-slate-300">{WEEKDAY_LABELS[group.day].label}</span>
                      </div>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        {group.items.length} kegiatan
                      </span>
                    </header>

                    <div className="mt-4 space-y-4">
                      {group.items.map((schedule) => (
                        <article
                          key={schedule.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_25px_60px_-45px_rgba(16,185,129,0.65)]"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <h5 className="text-lg font-semibold text-white">{schedule.title ?? 'Tanpa judul'}</h5>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-medium text-emerald-200">
                                  {formatTimeRange(schedule.startTime, schedule.endTime)}
                                </span>
                                {schedule.room && (
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                                    Ruang {schedule.room}
                                  </span>
                                )}
                              </div>
                              {schedule.description && (
                                <p className="text-sm text-slate-300">{schedule.description}</p>
                              )}
                              {schedule.hints.length > 0 && (
                                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                                  Kata kunci: {schedule.hints.join(', ')}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => handleEdit(schedule)}
                                className="rounded-full border border-white/10 px-4 py-2 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                              >
                                Ubah
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === schedule.id}
                                onClick={() => handleDelete(schedule.id)}
                                className="rounded-full border border-rose-400/30 px-4 py-2 text-rose-300 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === schedule.id ? 'Menghapus…' : 'Hapus'}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_25px_80px_-60px_rgba(6,182,212,0.55)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                  {mode === 'create' ? 'Tambah Jadwal' : 'Ubah Jadwal'}
                </p>
                <h4 className="mt-2 text-lg font-semibold text-white">
                  {mode === 'create' ? 'Slot Baru' : 'Perbarui Slot'}
                </h4>
              </div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-emerald-100"
                >
                  Batal
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-title">
                  Judul
                </label>
                <input
                  id="schedule-title"
                  type="text"
                  required
                  disabled={!canManage || submitting}
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Contoh: Matematika Diskrit"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-day">
                    Hari
                  </label>
                  <select
                    id="schedule-day"
                    value={form.dayOfWeek}
                    disabled={!canManage || submitting}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        dayOfWeek: event.target.value as FormState['dayOfWeek']
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {WEEKDAY_LABELS[day].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-room">
                    Ruangan (opsional)
                  </label>
                  <input
                    id="schedule-room"
                    type="text"
                    disabled={!canManage || submitting}
                    value={form.room}
                    onChange={(event) => setForm((previous) => ({ ...previous, room: event.target.value }))}
                    placeholder="Contoh: R.301"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-start">
                    Jam Mulai
                  </label>
                  <input
                    id="schedule-start"
                    type="time"
                    required
                    step={300}
                    disabled={!canManage || submitting}
                    value={form.startTime}
                    onChange={(event) => setForm((previous) => ({ ...previous, startTime: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-end">
                    Jam Selesai
                  </label>
                  <input
                    id="schedule-end"
                    type="time"
                    required
                    step={300}
                    disabled={!canManage || submitting}
                    value={form.endTime}
                    onChange={(event) => setForm((previous) => ({ ...previous, endTime: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-hints">
                  Hint pencarian (opsional)
                </label>
                <input
                  id="schedule-hints"
                  type="text"
                  disabled={!canManage || submitting}
                  value={form.hints}
                  onChange={(event) => setForm((previous) => ({ ...previous, hints: event.target.value }))}
                  placeholder="Pisahkan dengan koma, contoh: uts, materi, online"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-slate-400">
                  Hint membantu mahasiswa mencari jadwal lewat kata kunci di WhatsApp. Maksimal 10 kata.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="schedule-notes">
                  Catatan (opsional)
                </label>
                <textarea
                  id="schedule-notes"
                  rows={3}
                  disabled={!canManage || submitting}
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="Materi, dosen pengampu, atau pengingat tambahan."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {status && (
              <p
                className={`text-sm ${
                  status.type === 'success' ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!canManage || submitting}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-[2px] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? mode === 'create'
                  ? 'Menyimpan Jadwal…'
                  : 'Memperbarui…'
                : mode === 'create'
                  ? 'Tambahkan Jadwal'
                  : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function formatTimeRange(start: string, end: string) {
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}
