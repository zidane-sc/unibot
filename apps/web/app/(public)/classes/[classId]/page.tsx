import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import prisma from '../../../../lib/prisma';
import { WEEKDAY_LABELS, WEEKDAY_ORDER, sortByWeekdayAndStartTime } from '../../../../lib/weekdays';

type PublicClassPageParams = {
  classId: string;
};

type PublicSchedule = {
  id: string;
  title: string | null;
  description: string | null;
  room: string | null;
  hints: string[];
  dayOfWeek: keyof typeof WEEKDAY_LABELS;
  startTime: string;
  endTime: string;
  groups: PublicGroup[];
};

type PublicAssignment = {
  id: string;
  title: string | null;
  description: string | null;
  hints: string[];
  dueAt: string | null;
  schedule: {
    id: string;
    title: string | null;
    dayOfWeek: keyof typeof WEEKDAY_LABELS;
    startTime: string;
    endTime: string;
  } | null;
};

type PublicGroup = {
  id: string;
  name: string;
  scheduleId: string | null;
  hints: string[];
  members: {
    id: string;
    name: string;
  }[];
};

type PublicClass = {
  id: string;
  name: string | null;
  description: string | null;
  schedules: PublicSchedule[];
  assignments: PublicAssignment[];
};

export async function generateMetadata({ params }: { params: PublicClassPageParams }): Promise<Metadata> {
  const data = await loadClass(params.classId);

  if (!data) {
    return {
      title: 'Kelas tidak ditemukan • Unibot',
      description: 'Kelas yang kamu cari tidak tersedia atau telah diarsipkan.'
    };
  }

  const name = data.name ?? 'Kelas tanpa nama';

  return {
    title: `${name} • Unibot`,
    description: data.description ?? 'Lihat jadwal, tugas, dan kelompok yang dibagikan untuk kelas ini.'
  };
}

export default async function PublicClassPage({ params }: { params: PublicClassPageParams }) {
  const data = await loadClass(params.classId);

  if (!data) {
    notFound();
  }

  const className = data.name ?? 'Kelas tanpa nama';
  const classDescription = data.description ?? 'Ketua kelas belum menambahkan deskripsi untuk kelas ini.';

  const schedules = [...data.schedules].sort(sortByWeekdayAndStartTime);
  const scheduleByDay = groupSchedulesByDay(schedules);
  const assignments = sortAssignments(data.assignments);
  const allGroups = extractGroupsFromSchedules(schedules);

  return (
    <main className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[140px]" />
        <div className="absolute right-[-8%] top-[18rem] hidden h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] lg:block" />
        <div className="absolute left-[-6%] bottom-[-8rem] h-72 w-72 rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-20 md:px-12">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-300/80">
            <span>Kelas Publik</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{className}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{classDescription}</p>
          </div>
        </header>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Jadwal Mingguan</h2>
            <p className="mt-2 text-sm text-slate-300">Aktivitas rutin kelas berdasarkan hari dan jam pelaksanaan.</p>
          </div>

          {schedules.length === 0 ? (
            <EmptyState message="Belum ada jadwal untuk kelas ini." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {scheduleByDay.map(({ day, items }) => (
                <article key={day} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <header className="flex items-baseline justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-sm font-semibold text-emerald-300">
                        {WEEKDAY_LABELS[day].short}
                      </div>
                      <h3 className="text-lg font-medium text-white">{WEEKDAY_LABELS[day].label}</h3>
                    </div>
                    <span className="text-xs text-slate-400">{items.length} kegiatan</span>
                  </header>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono text-sm text-emerald-200">
                            {formatTimeLabel(item.startTime)} - {formatTimeLabel(item.endTime)}
                          </span>
                          {item.room ? (
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-slate-300">
                              {item.room}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-base font-semibold text-white">{item.title ?? 'Tanpa judul'}</h4>
                        {item.description ? <p className="text-sm text-slate-300">{item.description}</p> : null}
                        {item.hints.length ? (
                          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                            Kata kunci: {item.hints.join(', ')}
                          </p>
                        ) : null}
                        {item.groups.length ? (
                          <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Kelompok</p>
                            <ul className="space-y-2">
                              {item.groups.map((group) => (
                                <li key={group.id} className="rounded-2xl border border-emerald-400/10 bg-emerald-400/10 p-3">
                                  <p className="text-sm font-medium text-emerald-100">{group.name}</p>
                                  {group.members.length ? (
                                    <p className="mt-1 text-xs text-emerald-200">
                                      {group.members.map((member) => member.name).join(', ')}
                                    </p>
                                  ) : (
                                    <p className="mt-1 text-xs text-emerald-200/70">Belum ada anggota.</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Tugas & Deadline</h2>
            <p className="mt-2 text-sm text-slate-300">Semua tugas yang dicatat oleh ketua kelas, termasuk tenggat dan kaitan ke jadwal.</p>
          </div>

          {assignments.length === 0 ? (
            <EmptyState message="Belum ada tugas yang dipublikasikan." />
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <article key={assignment.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-lg font-semibold text-white">{assignment.title ?? 'Tugas tanpa judul'}</h3>
                    {assignment.dueAt ? (
                      <time className="text-xs uppercase tracking-[0.35em] text-emerald-300/80" dateTime={assignment.dueAt}>
                        Batas • {formatDueDate(assignment.dueAt)}
                      </time>
                    ) : null}
                  </div>
                  {assignment.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{assignment.description}</p>
                  ) : null}
                  {assignment.hints.length ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                      Kata kunci: {assignment.hints.join(', ')}
                    </p>
                  ) : null}
                  {assignment.schedule ? (
                    <p className="mt-4 text-xs text-slate-400">
                      Terhubung ke jadwal {assignment.schedule.title ?? 'tanpa judul'} • {WEEKDAY_LABELS[assignment.schedule.dayOfWeek].label}{' '}
                      ({formatTimeLabel(assignment.schedule.startTime)} - {formatTimeLabel(assignment.schedule.endTime)})
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Kelompok & Anggota</h2>
            <p className="mt-2 text-sm text-slate-300">
              Daftar seluruh kelompok yang terhubung ke kelas ini. Data berasal dari dashboard admin dan diperbarui otomatis.
            </p>
          </div>

          {allGroups.length === 0 ? (
            <EmptyState message="Belum ada kelompok yang dipublikasikan." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allGroups.map((group) => (
                <article key={group.id} className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                  <header className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Kelompok</p>
                    <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                    {group.scheduleId ? (
                      <p className="text-xs text-slate-400">Terhubung ke jadwal: {resolveScheduleLabel(group.scheduleId, schedules)}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Tidak terhubung ke jadwal mana pun.</p>
                    )}
                    {group.hints.length ? (
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                        Kata kunci: {group.hints.join(', ')}
                      </p>
                    ) : null}
                  </header>
                  {group.members.length ? (
                    <ul className="space-y-2">
                      {group.members.map((member) => (
                        <li key={member.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          {member.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-300">Belum ada anggota yang terdaftar.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const loadClass = cache(async (classId: string): Promise<PublicClass | null> => {
  if (!classId) {
    return null;
  }

  const record = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      description: true,
      schedules: {
        select: {
          id: true,
          title: true,
          description: true,
          room: true,
          hints: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          groups: {
            select: {
              id: true,
              name: true,
              scheduleId: true,
              hints: true,
              members: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      },
      assignments: {
        select: {
          id: true,
          title: true,
          description: true,
          hints: true,
          dueAt: true,
          schedule: {
            select: {
              id: true,
              title: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true
            }
          }
        }
      }
    }
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    schedules: record.schedules.map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      room: schedule.room,
      hints: schedule.hints,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groups: schedule.groups
        .map((group) => ({
          id: group.id,
          name: group.name,
          scheduleId: group.scheduleId,
          hints: group.hints,
          members: group.members
            .map((member) => ({
              id: member.id,
              name: member.name
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
    })),
    assignments: record.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      hints: assignment.hints,
      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
      schedule: assignment.schedule
        ? {
            id: assignment.schedule.id,
            title: assignment.schedule.title,
            dayOfWeek: assignment.schedule.dayOfWeek,
            startTime: assignment.schedule.startTime,
            endTime: assignment.schedule.endTime
          }
        : null
    }))
  };
});

function groupSchedulesByDay(schedules: PublicSchedule[]) {
  const map = new Map<PublicSchedule['dayOfWeek'], PublicSchedule[]>();

  for (const schedule of schedules) {
    const existing = map.get(schedule.dayOfWeek) ?? [];
    existing.push(schedule);
    map.set(schedule.dayOfWeek, existing);
  }

  return Array.from(map.entries())
    .sort(([dayA], [dayB]) => WEEKDAY_ORDER[dayA] - WEEKDAY_ORDER[dayB])
    .map(([day, items]) => ({
      day,
      items: [...items].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
}

function extractGroupsFromSchedules(schedules: PublicSchedule[]): PublicGroup[] {
  const groups = schedules.flatMap((schedule) =>
    schedule.groups.map((group) => ({
      ...group,
      scheduleId: group.scheduleId ?? schedule.id
    }))
  );

  const unique = new Map<string, PublicGroup>();

  for (const group of groups) {
    if (!unique.has(group.id)) {
      unique.set(group.id, group);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

function resolveScheduleLabel(targetScheduleId: string, schedules: PublicSchedule[]) {
  const schedule = schedules.find((item) => item.id === targetScheduleId);

  if (!schedule) {
    return 'Jadwal tidak ditemukan';
  }

  return `${schedule.title ?? 'Tanpa judul'} • ${WEEKDAY_LABELS[schedule.dayOfWeek].label} ${formatTimeLabel(
    schedule.startTime
  )}-${formatTimeLabel(schedule.endTime)}`;
}

function sortAssignments(assignments: PublicAssignment[]) {
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

function formatTimeLabel(value: string) {
  return value.slice(0, 5);
}

function formatDueDate(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return value;
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
      {message}
    </div>
  );
}
