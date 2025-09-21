'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import type { AdminClass, AssignmentRecord } from '../types';

type FormState = {
  title: string;
  description: string;
  dueAt: string;
};

type StatusState = { type: 'success' | 'error'; message: string } | null;

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta'
});

function createEmptyForm(overrides?: Partial<FormState>): FormState {
  return {
    title: '',
    description: '',
    dueAt: '',
    ...overrides
  };
}

export default function AssignmentManager({ classes }: { classes: AdminClass[] }) {
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

  const assignments = selectedClass?.assignments ?? [];
  const canManage = Boolean(selectedClass);

  const handleSelectClass = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(event.target.value);
    setMode('create');
    setEditingId(null);
    setForm(createEmptyForm());
    setStatus(null);
  };

  const handleEdit = (assignment: AssignmentRecord) => {
    setMode('edit');
    setEditingId(assignment.id);
    setForm({
      title: assignment.title ?? '',
      description: assignment.description ?? '',
      dueAt: toInputDateTime(assignment.dueAt)
    });
    setStatus(null);
  };

  const handleCancelEdit = () => {
    setMode('create');
    setEditingId(null);
    setForm(createEmptyForm());
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClass) {
      setStatus({ type: 'error', message: 'Pilih kelas terlebih dahulu.' });
      return;
    }

    if (mode === 'edit' && !editingId) {
      setStatus({ type: 'error', message: 'Data tugas tidak ditemukan.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const trimmedTitle = form.title.trim();

    if (trimmedTitle.length === 0) {
      setStatus({ type: 'error', message: 'Judul tugas wajib diisi.' });
      setSubmitting(false);
      return;
    }

    const payload: {
      title: string;
      description?: string;
      dueAt?: string | null;
    } = {
      title: trimmedTitle
    };

    const descriptionValue = form.description.trim();

    if (descriptionValue.length > 0) {
      payload.description = descriptionValue;
    }

    const dueAtIso = convertInputToIso(form.dueAt);

    if (dueAtIso === 'invalid') {
      setStatus({ type: 'error', message: 'Format tenggat tidak valid.' });
      setSubmitting(false);
      return;
    }

    if (dueAtIso) {
      payload.dueAt = dueAtIso;
    } else {
      payload.dueAt = null;
    }

    try {
      const response = await fetch(
        mode === 'create'
          ? `/api/admin/classes/${selectedClass.id}/assignments`
          : `/api/admin/assignments/${editingId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = (await response.json().catch(() => ({}))) as {
        assignment?: AssignmentRecord;
        error?: string;
      };

      if (!response.ok || !data.assignment) {
        setStatus({
          type: 'error',
          message: data.error ?? 'Gagal menyimpan tugas. Coba lagi.'
        });
        return;
      }

      const savedAssignment = data.assignment;
      const targetClassId = savedAssignment.classId;

      setClassState((current) =>
        current.map((item) => {
          if (item.id !== targetClassId) {
            return item;
          }

          if (mode === 'create') {
            return {
              ...item,
              assignments: sortAssignments([...item.assignments, savedAssignment])
            };
          }

          const containsAssignment = item.assignments.some((existing) => existing.id === savedAssignment.id);

          if (!containsAssignment) {
            return item;
          }

          return {
            ...item,
            assignments: sortAssignments(
              item.assignments.map((existing) =>
                existing.id === savedAssignment.id ? savedAssignment : existing
              )
            )
          };
        })
      );

      setStatus({
        type: 'success',
        message: mode === 'create' ? 'Tugas berhasil ditambahkan.' : 'Tugas berhasil diperbarui.'
      });

      if (mode === 'create') {
        setForm(createEmptyForm());
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

  const handleDelete = async (assignmentId: string) => {
    const confirmed = window.confirm('Hapus tugas ini?');

    if (!confirmed) {
      return;
    }

    if (mode === 'edit' && editingId === assignmentId) {
      handleCancelEdit();
    }

    setDeletingId(assignmentId);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        classId?: string;
      };

      if (!response.ok || data.ok !== true) {
        setStatus({ type: 'error', message: data.error ?? 'Gagal menghapus tugas.' });
        return;
      }

      const targetClassId = data.classId;

      setClassState((current) =>
        current.map((item) => {
          if (targetClassId && item.id !== targetClassId) {
            return item;
          }

          const filtered = item.assignments.filter((assignment) => assignment.id !== assignmentId);

          if (filtered.length === item.assignments.length) {
            return item;
          }

          return {
            ...item,
            assignments: filtered
          };
        })
      );

      setStatus({ type: 'success', message: 'Tugas berhasil dihapus.' });
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
          <p className="text-sm text-slate-300">Ganti kelas untuk mengatur tugas yang terkait.</p>
        </div>
        {classState.length > 0 ? (
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Daftar Tugas</h4>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-emerald-200">
                {assignments.length} tugas
              </span>
            </div>

            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-300">
                <p className="text-sm">Belum ada tugas untuk kelas ini. Tambahkan tugas pertama melalui formulir di samping.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_25px_60px_-45px_rgba(16,185,129,0.65)]"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h5 className="text-lg font-semibold text-white">{assignment.title ?? 'Tanpa judul'}</h5>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-medium text-emerald-200">
                            {formatDueDate(assignment.dueAt)}
                          </span>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-slate-300">{assignment.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleEdit(assignment)}
                          className="rounded-full border border-white/10 px-4 py-2 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === assignment.id}
                          onClick={() => handleDelete(assignment.id)}
                          className="rounded-full border border-rose-400/30 px-4 py-2 text-rose-300 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === assignment.id ? 'Menghapus…' : 'Hapus'}
                        </button>
                      </div>
                    </div>
                  </article>
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
                  {mode === 'create' ? 'Tambah Tugas' : 'Ubah Tugas'}
                </p>
                <h4 className="mt-2 text-lg font-semibold text-white">
                  {mode === 'create' ? 'Tugas Baru' : 'Perbarui Tugas'}
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
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="assignment-title">
                  Judul
                </label>
                <input
                  id="assignment-title"
                  type="text"
                  required
                  disabled={!canManage || submitting}
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Contoh: Tugas Bab 3"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="assignment-due">
                  Tenggat (opsional)
                </label>
                <input
                  id="assignment-due"
                  type="datetime-local"
                  disabled={!canManage || submitting}
                  value={form.dueAt}
                  onChange={(event) => setForm((previous) => ({ ...previous, dueAt: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80" htmlFor="assignment-notes">
                  Deskripsi (opsional)
                </label>
                <textarea
                  id="assignment-notes"
                  rows={3}
                  disabled={!canManage || submitting}
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="Detail pengerjaan, format pengumpulan, atau catatan tambahan."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {status && (
              <p className={`text-sm ${status.type === 'success' ? 'text-emerald-300' : 'text-rose-400'}`}>
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
                  ? 'Menyimpan Tugas…'
                  : 'Memperbarui…'
                : mode === 'create'
                  ? 'Tambahkan Tugas'
                  : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function toInputDateTime(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function convertInputToIso(value: string): string | null | 'invalid' {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return 'invalid';
  }

  return date.toISOString();
}

function formatDueDate(value: string | null) {
  if (!value) {
    return 'Tanpa tenggat';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Tanpa tenggat';
  }

  return DATE_TIME_FORMATTER.format(date);
}

function sortAssignments(assignments: AssignmentRecord[]): AssignmentRecord[] {
  return [...assignments].sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      return a.dueAt.localeCompare(b.dueAt);
    }

    if (a.dueAt) {
      return -1;
    }

    if (b.dueAt) {
      return 1;
    }

    const titleA = a.title ?? '';
    const titleB = b.title ?? '';

    const comparison = titleA.localeCompare(titleB, 'id');

    if (comparison !== 0) {
      return comparison;
    }

    return a.id.localeCompare(b.id);
  });
}
