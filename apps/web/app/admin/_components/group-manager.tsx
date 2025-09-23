'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import type { AdminClass, GroupMemberRecord, GroupRecord } from '../types';
import { WEEKDAY_LABELS, WEEKDAY_TO_DAYJS_INDEX } from '../../../lib/weekdays';

type GroupFormState = {
  name: string;
  scheduleId: string;
  hints: string;
};

type MemberFormState = {
  name: string;
  phone: string;
};

type StatusState = { type: 'success' | 'error'; message: string } | null;

type MemberFormMeta = {
  mode: 'create' | 'edit';
  groupId: string | null;
  memberId: string | null;
};

function createEmptyGroupForm(scheduleId: string): GroupFormState {
  return {
    name: '',
    scheduleId,
    hints: ''
  };
}

function createEmptyMemberForm(): MemberFormState {
  return {
    name: '',
    phone: ''
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

export default function GroupManager({ classes }: { classes: AdminClass[] }) {
  const [classState, setClassState] = useState<AdminClass[]>(classes);
  const [selectedClassId, setSelectedClassId] = useState(() => classes[0]?.id ?? '');
  const initialScheduleId = classes[0]?.schedules[0]?.id ?? '';
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId);
  const [groupMode, setGroupMode] = useState<'create' | 'edit'>('create');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(() => createEmptyGroupForm(initialScheduleId));
  const [groupStatus, setGroupStatus] = useState<StatusState>(null);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [memberForm, setMemberForm] = useState<MemberFormState>(() => createEmptyMemberForm());
  const [memberFormMeta, setMemberFormMeta] = useState<MemberFormMeta>({
    mode: 'create',
    groupId: null,
    memberId: null
  });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberStatus, setMemberStatus] = useState<StatusState>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const selectedClass = useMemo(
    () => classState.find((item) => item.id === selectedClassId),
    [classState, selectedClassId]
  );

  const schedules = selectedClass?.schedules ?? [];
  const scheduleOptions = schedules.map((item) => ({
    id: item.id,
    label: formatScheduleLabel(item)
  }));

  const groups = useMemo(() => {
    if (!selectedClass) {
      return [] as GroupRecord[];
    }

    if (!selectedScheduleId) {
      return sortGroups(selectedClass.groups);
    }

    return sortGroups(selectedClass.groups.filter((group) => group.scheduleId === selectedScheduleId));
  }, [selectedClass, selectedScheduleId]);

  const canManageGroup = Boolean(selectedClass) && schedules.length > 0;

  const memberFormGroup = groups.find((group) => group.id === memberFormMeta.groupId);

  const handleSelectClass = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextClassId = event.target.value;
    const nextClass = classState.find((item) => item.id === nextClassId);
    const nextScheduleId = nextClass?.schedules[0]?.id ?? '';

    setSelectedClassId(nextClassId);
    setSelectedScheduleId(nextScheduleId);
    setGroupMode('create');
    setEditingGroupId(null);
    setGroupForm(createEmptyGroupForm(nextScheduleId));
    setGroupStatus(null);
    setMemberForm(createEmptyMemberForm());
    setMemberFormMeta({ mode: 'create', groupId: null, memberId: null });
    setMemberStatus(null);
  };

  const handleSelectSchedule = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextScheduleId = event.target.value;
    setSelectedScheduleId(nextScheduleId);

    if (groupMode === 'create') {
      setGroupForm((prev) => ({ ...prev, scheduleId: nextScheduleId }));
    }

    setMemberFormMeta((prev) => ({ ...prev, groupId: null, memberId: null }));
    setMemberStatus(null);
  };

  const handleGroupFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartCreateMember = (groupId: string) => {
    setMemberForm(createEmptyMemberForm());
    setMemberFormMeta({ mode: 'create', groupId, memberId: null });
    setMemberStatus(null);
  };

  const handleEditMember = (member: GroupMemberRecord) => {
    setMemberForm({ name: member.name, phone: member.phone ?? '' });
    setMemberFormMeta({ mode: 'edit', groupId: member.groupId, memberId: member.id });
    setMemberStatus(null);
  };

  const handleCancelMemberForm = () => {
    setMemberForm(createEmptyMemberForm());
    setMemberFormMeta({ mode: 'create', groupId: null, memberId: null });
    setMemberStatus(null);
  };

  const handleEditGroup = (group: GroupRecord) => {
    setGroupMode('edit');
    setEditingGroupId(group.id);
    setGroupForm({ name: group.name, scheduleId: group.scheduleId ?? '', hints: group.hints.join(', ') });
    setGroupStatus(null);
    setSelectedScheduleId(group.scheduleId ?? '');
  };

  const handleCancelGroupEdit = () => {
    setGroupMode('create');
    setEditingGroupId(null);
    setGroupForm(createEmptyGroupForm(selectedScheduleId));
    setGroupStatus(null);
  };

  const handleSubmitGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClass) {
      setGroupStatus({ type: 'error', message: 'Pilih kelas terlebih dahulu.' });
      return;
    }

    if (!groupForm.scheduleId) {
      setGroupStatus({ type: 'error', message: 'Pilih jadwal mata kuliah terlebih dahulu.' });
      return;
    }

    if (groupMode === 'edit' && !editingGroupId) {
      setGroupStatus({ type: 'error', message: 'Data grup tidak ditemukan.' });
      return;
    }

    const trimmedName = groupForm.name.trim();

    if (trimmedName.length === 0) {
      setGroupStatus({ type: 'error', message: 'Nama grup wajib diisi.' });
      return;
    }

    setGroupSubmitting(true);
    setGroupStatus(null);

    try {
      const response = await fetch(
        groupMode === 'create'
          ? `/api/admin/classes/${selectedClass.id}/groups`
          : `/api/admin/groups/${editingGroupId}`,
        {
          method: groupMode === 'create' ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            scheduleId: groupForm.scheduleId,
            hints: parseHintsInput(groupForm.hints)
          })
        }
      );

      const data = (await response.json().catch(() => ({}))) as {
        group?: GroupRecord;
        error?: string;
      };

      if (!response.ok || !data.group) {
        setGroupStatus({
          type: 'error',
          message: data.error ?? 'Gagal menyimpan grup. Coba lagi.'
        });
        return;
      }

      const savedGroup = data.group;

      setClassState((current) =>
        current.map((item) => {
          if (item.id !== savedGroup.classId) {
            return item;
          }

          const nextGroups = groupMode === 'create'
            ? sortGroups([...item.groups, savedGroup])
            : sortGroups(item.groups.map((existing) => (existing.id === savedGroup.id ? savedGroup : existing)));

          return {
            ...item,
            groups: nextGroups
          };
        })
      );

      setGroupStatus({
        type: 'success',
        message: groupMode === 'create' ? 'Grup berhasil ditambahkan.' : 'Grup berhasil diperbarui.'
      });

      if (groupMode === 'create') {
        setGroupForm(createEmptyGroupForm(groupForm.scheduleId));
      } else {
        handleCancelGroupEdit();
      }
    } catch (error) {
      console.error(error);
      setGroupStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group: GroupRecord) => {
    const confirmed = window.confirm('Hapus grup ini? Seluruh anggota di dalamnya juga akan dihapus.');

    if (!confirmed) {
      return;
    }

    setDeletingGroupId(group.id);
    setGroupStatus(null);

    if (groupMode === 'edit' && editingGroupId === group.id) {
      handleCancelGroupEdit();
    }

    try {
      const response = await fetch(`/api/admin/groups/${group.id}`, { method: 'DELETE' });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        classId?: string;
      };

      if (!response.ok || data.ok !== true || !data.classId) {
        setGroupStatus({ type: 'error', message: data.error ?? 'Gagal menghapus grup.' });
        return;
      }

      setClassState((current) =>
        current.map((item) => {
          if (item.id !== data.classId) {
            return item;
          }

          return {
            ...item,
            groups: item.groups.filter((existing) => existing.id !== group.id)
          };
        })
      );

      if (memberFormMeta.groupId === group.id) {
        handleCancelMemberForm();
      }

      setGroupStatus({ type: 'success', message: 'Grup berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      setGroupStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleSubmitMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetGroupId = memberFormMeta.groupId;

    if (!targetGroupId) {
      setMemberStatus({ type: 'error', message: 'Pilih grup terlebih dahulu.' });
      return;
    }

    const trimmedName = memberForm.name.trim();

    if (trimmedName.length === 0) {
      setMemberStatus({ type: 'error', message: 'Nama anggota wajib diisi.' });
      return;
    }

    const phoneValue = memberForm.phone.trim();

    setMemberSubmitting(true);
    setMemberStatus(null);

    try {
      const response = await fetch(
        memberFormMeta.mode === 'create'
          ? `/api/admin/groups/${targetGroupId}/members`
          : `/api/admin/group-members/${memberFormMeta.memberId}`,
        {
          method: memberFormMeta.mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            phone: phoneValue
          })
        }
      );

      const data = (await response.json().catch(() => ({}))) as {
        member?: GroupMemberRecord;
        error?: string;
      };

      if (!response.ok || !data.member) {
        setMemberStatus({
          type: 'error',
          message: data.error ?? 'Gagal menyimpan anggota. Coba lagi.'
        });
        return;
      }

      const savedMember = data.member;

      setClassState((current) =>
        current.map((cls) => {
          if (!cls.groups.some((group) => group.id === savedMember.groupId)) {
            return cls;
          }

          return {
            ...cls,
            groups: cls.groups.map((group) => {
              if (group.id !== savedMember.groupId) {
                return group;
              }

              const nextMembers = memberFormMeta.mode === 'create'
                ? sortMembers([...group.members, savedMember])
                : sortMembers(group.members.map((existing) => (existing.id === savedMember.id ? savedMember : existing)));

              return {
                ...group,
                members: nextMembers
              };
            })
          };
        })
      );

      setMemberStatus({
        type: 'success',
        message:
          memberFormMeta.mode === 'create'
            ? 'Anggota berhasil ditambahkan.'
            : 'Anggota berhasil diperbarui.'
      });

      if (memberFormMeta.mode === 'create') {
        setMemberForm(createEmptyMemberForm());
      } else {
        handleCancelMemberForm();
      }
    } catch (error) {
      console.error(error);
      setMemberStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleDeleteMember = async (member: GroupMemberRecord) => {
    const confirmed = window.confirm(`Hapus ${member.name} dari grup?`);

    if (!confirmed) {
      return;
    }

    setDeletingMemberId(member.id);
    setMemberStatus(null);

    if (memberFormMeta.mode === 'edit' && memberFormMeta.memberId === member.id) {
      handleCancelMemberForm();
    }

    try {
      const response = await fetch(`/api/admin/group-members/${member.id}`, {
        method: 'DELETE'
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        groupId?: string;
      };

      if (!response.ok || data.ok !== true || !data.groupId) {
        setMemberStatus({ type: 'error', message: data.error ?? 'Gagal menghapus anggota.' });
        return;
      }

      setClassState((current) =>
        current.map((cls) => {
          if (!cls.groups.some((group) => group.id === data.groupId)) {
            return cls;
          }

          return {
            ...cls,
            groups: cls.groups.map((group) => {
              if (group.id !== data.groupId) {
                return group;
              }

              return {
                ...group,
                members: group.members.filter((existing) => existing.id !== member.id)
              };
            })
          };
        })
      );

      setMemberStatus({ type: 'success', message: 'Anggota berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      setMemberStatus({ type: 'error', message: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_35px_120px_-70px_rgba(56,189,248,0.55)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Pilih Kelas</h3>
          <p className="text-sm text-slate-300">Kelola kelompok beserta anggotanya.</p>
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
          <p className="mt-3 text-sm">Hubungi tim akademik untuk memastikan data kelas kamu sudah terdaftar.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-base font-semibold text-white">Filter Jadwal</h4>
                <p className="text-sm text-slate-300">Tampilkan grup berdasarkan jadwal mata kuliah.</p>
              </div>
              {scheduleOptions.length > 0 ? (
                <select
                  value={selectedScheduleId}
                  onChange={handleSelectSchedule}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 md:w-72"
                >
                  <option value="">Semua jadwal</option>
                  {scheduleOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                  Tambahkan jadwal terlebih dahulu.
                </div>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-300">
                <p className="text-sm">Belum ada grup terdaftar untuk filter ini. Tambahkan grup melalui formulir di samping.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((group) => (
                  <article
                    key={group.id}
                    className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_25px_60px_-45px_rgba(16,185,129,0.65)]"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h5 className="text-lg font-semibold text-white">{group.name}</h5>
                        {group.schedule ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-medium text-emerald-200">
                              {WEEKDAY_LABELS[group.schedule.dayOfWeek].short} ·{' '}
                              {formatTimeRange(group.schedule.startTime, group.schedule.endTime)}
                            </span>
                            {group.schedule.title && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                                {group.schedule.title}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-200">Grup belum terhubung ke jadwal.</p>
                        )}
                        {group.hints.length > 0 && (
                          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                            Kata kunci: {group.hints.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleEditGroup(group)}
                          className="rounded-full border border-white/10 px-4 py-2 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group)}
                          disabled={deletingGroupId === group.id}
                          className="rounded-full border border-rose-400/30 px-4 py-2 text-rose-300 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingGroupId === group.id ? 'Menghapus…' : 'Hapus'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <header className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Anggota ({group.members.length})</p>
                        <button
                          type="button"
                          onClick={() => handleStartCreateMember(group.id)}
                          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                        >
                          Tambah Anggota
                        </button>
                      </header>

                      {group.members.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-300">Belum ada anggota yang terdaftar.</p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {group.members.map((member) => (
                            <li
                              key={member.id}
                              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-white">{member.name}</p>
                                {member.phone ? (
                                  <p className="text-xs text-slate-300">{member.phone}</p>
                                ) : (
                                  <p className="text-xs text-slate-500">Nomor tidak tersedia</p>
                                )}
                              </div>
                              <div className="flex gap-2 text-xs font-semibold">
                                <button
                                  type="button"
                                  onClick={() => handleEditMember(member)}
                                  className="rounded-full border border-white/10 px-4 py-2 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                                >
                                  Ubah
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member)}
                                  disabled={deletingMemberId === member.id}
                                  className="rounded-full border border-rose-400/30 px-4 py-2 text-rose-300 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingMemberId === member.id ? 'Menghapus…' : 'Hapus'}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {memberFormMeta.groupId === group.id && (
                        <form onSubmit={handleSubmitMember} className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                              {memberFormMeta.mode === 'create' ? 'Tambah Anggota' : 'Ubah Anggota'}
                            </p>
                            <button
                              type="button"
                              onClick={handleCancelMemberForm}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-emerald-100"
                            >
                              Batal
                            </button>
                          </div>
                          <div className="space-y-3">
                            <label className="space-y-1 text-sm text-slate-200">
                              <span>Nama lengkap</span>
                              <input
                                name="name"
                                value={memberForm.name}
                                onChange={handleMemberFormChange}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
                              />
                            </label>
                            <label className="space-y-1 text-sm text-slate-200">
                              <span>Nomor WhatsApp (opsional)</span>
                              <input
                                name="phone"
                                value={memberForm.phone}
                                onChange={handleMemberFormChange}
                                placeholder="contoh: +628123456789"
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
                              />
                            </label>
                          </div>
                          {memberStatus && (
                            <p
                              className={`text-xs ${
                                memberStatus.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {memberStatus.message}
                            </p>
                          )}
                          <button
                            type="submit"
                            disabled={memberSubmitting}
                            className="w-full rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {memberSubmitting
                              ? 'Menyimpan…'
                              : memberFormMeta.mode === 'create'
                              ? 'Simpan Anggota'
                              : 'Perbarui Anggota'}
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmitGroup}
            className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_25px_80px_-60px_rgba(6,182,212,0.55)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                  {groupMode === 'create' ? 'Tambah Kelompok' : 'Ubah Kelompok'}
                </p>
                <h4 className="mt-2 text-lg font-semibold text-white">
                  {groupMode === 'create' ? 'Kelompok Baru' : 'Perbarui Kelompok'}
                </h4>
              </div>
              {groupMode === 'edit' && (
                <button
                  type="button"
                  onClick={handleCancelGroupEdit}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-emerald-100"
                >
                  Batal
                </button>
              )}
            </div>

            <label className="space-y-1 text-sm text-slate-200">
              <span>Nama kelompok</span>
              <input
                name="name"
                value={groupForm.name}
                onChange={handleGroupFormChange}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
                placeholder="contoh: Kelompok 1"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-200">
              <span>Terhubung ke jadwal</span>
              <select
                name="scheduleId"
                value={groupForm.scheduleId}
                onChange={handleGroupFormChange}
                disabled={!canManageGroup}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Pilih jadwal</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {formatScheduleLabel(schedule)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-200">
              <span>Hint pencarian (opsional)</span>
              <input
                name="hints"
                value={groupForm.hints}
                onChange={handleGroupFormChange}
                placeholder="Pisahkan dengan koma, contoh: debat, presentasi"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/40"
              />
              <p className="text-xs text-slate-400">
                Hint membantu anggota mencari grup lewat kata kunci di WhatsApp. Maksimal 10 kata.
              </p>
            </label>

            {groupStatus && (
              <p
                className={`text-xs ${groupStatus.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {groupStatus.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!canManageGroup || groupSubmitting}
              className="w-full rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {groupSubmitting
                ? 'Menyimpan…'
                : groupMode === 'create'
                ? 'Simpan Grup'
                : 'Perbarui Grup'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function sortGroups(groups: GroupRecord[]): GroupRecord[] {
  return [...groups].sort((a, b) => {
    const scheduleA = a.schedule;
    const scheduleB = b.schedule;

    if (scheduleA && scheduleB) {
      const dayComparison =
        WEEKDAY_TO_DAYJS_INDEX[scheduleA.dayOfWeek] - WEEKDAY_TO_DAYJS_INDEX[scheduleB.dayOfWeek];

      if (dayComparison !== 0) {
        return dayComparison;
      }

      const startComparison = scheduleA.startTime.localeCompare(scheduleB.startTime);

      if (startComparison !== 0) {
        return startComparison;
      }
    } else if (scheduleA) {
      return -1;
    } else if (scheduleB) {
      return 1;
    }

    return a.name.localeCompare(b.name, 'id');
  });
}

function sortMembers(members: GroupMemberRecord[]): GroupMemberRecord[] {
  return [...members].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

function formatTimeRange(start: string, end: string) {
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
}

function formatTimeLabel(value: string) {
  return value?.slice(0, 5) ?? value;
}

function formatScheduleLabel(schedule: { title: string | null; dayOfWeek: keyof typeof WEEKDAY_LABELS; startTime: string; endTime: string }) {
  const label = WEEKDAY_LABELS[schedule.dayOfWeek];
  const title = schedule.title ?? 'Tanpa judul';
  return `${label.short} · ${title} (${formatTimeRange(schedule.startTime, schedule.endTime)})`;
}
