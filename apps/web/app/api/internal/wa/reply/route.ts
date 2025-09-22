import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { formatList } from '@unibot/shared/formatting';
import type { Prisma, Weekday } from '@prisma/client';
import prisma from '../../../../../lib/prisma';
import { phoneFromJid } from '../../../../../lib/auth';
import { WEEKDAY_LABELS, WEEKDAY_TO_DAYJS_INDEX } from '../../../../../lib/weekdays';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = process.env.TZ ?? 'Asia/Jakarta';

if (dayjs.tz) {
  dayjs.tz.setDefault(DEFAULT_TIMEZONE);
}

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

type IntentFilters = {
  relativeDay?: string;
  day?: string;
  query?: string;
  subject?: string;
  group?: string;
  groupQuery?: string;
};

type IntentPayload = {
  name: string;
  confidence?: number;
  matchedPhrase?: string;
  filters?: IntentFilters;
} | null;

type ContextPayload = {
  groupJid: string;
  senderJid: string;
  message?: string;
  classId?: string | null;
};

type IntentReply = {
  message?: string;
  mentions?: string[];
  register?: { classId: string };
};

type NonNullIntent = Exclude<IntentPayload, null>;

const MAX_RESULTS = 5;
const MEMBER_GROUP_LIMIT = 3;
const MAX_MEMBER_RESULTS = 5;

const RELATIVE_DAY_LABELS: Record<string, string> = {
  today: 'hari ini',
  tonight: 'malam ini',
  tomorrow: 'besok',
  'day-after-tomorrow': 'lusa',
  yesterday: 'kemarin',
  'this-week': 'minggu ini',
  'next-week': 'minggu depan'
};

const DAY_KEYWORD_MAP: Record<string, Weekday> = {
  senin: 'MONDAY',
  monday: 'MONDAY',
  selasa: 'TUESDAY',
  tuesday: 'TUESDAY',
  rabu: 'WEDNESDAY',
  wednesday: 'WEDNESDAY',
  kamis: 'THURSDAY',
  thursday: 'THURSDAY',
  jumat: 'FRIDAY',
  "jum'at": 'FRIDAY',
  friday: 'FRIDAY',
  sabtu: 'SATURDAY',
  saturday: 'SATURDAY',
  minggu: 'SUNDAY',
  sunday: 'SUNDAY'
};

const DAYJS_INDEX_TO_WEEKDAY_MAP: Record<number, Weekday> = Object.entries(WEEKDAY_TO_DAYJS_INDEX).reduce(
  (acc, [weekday, index]) => {
    acc[index] = weekday as Weekday;
    return acc;
  },
  {} as Record<number, Weekday>
);

function dayjsIndexToWeekday(index: number): Weekday | null {
  return DAYJS_INDEX_TO_WEEKDAY_MAP[index] ?? null;
}

function resolveRelativeDayToWeekday(relativeDay?: string | null): Weekday | null {
  if (!relativeDay) {
    return null;
  }

  const now = dayjs().tz(DEFAULT_TIMEZONE);

  switch (relativeDay) {
    case 'today':
    case 'tonight':
      return dayjsIndexToWeekday(now.day());
    case 'tomorrow':
      return dayjsIndexToWeekday(now.add(1, 'day').day());
    case 'day-after-tomorrow':
      return dayjsIndexToWeekday(now.add(2, 'day').day());
    case 'yesterday':
      return dayjsIndexToWeekday(now.subtract(1, 'day').day());
    default:
      return null;
  }
}

function parseDayKeyword(day?: string | null): Weekday | null {
  if (!day) {
    return null;
  }

  return DAY_KEYWORD_MAP[day.toLowerCase()] ?? null;
}

function resolveWeekdayFromFilters(filters?: IntentFilters): Weekday | null {
  if (!filters) {
    return null;
  }

  const relative = resolveRelativeDayToWeekday(filters.relativeDay);
  if (relative) {
    return relative;
  }

  return parseDayKeyword(filters.day);
}

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

function getRelativeDateRange(relativeDay?: string | null): DateRange | null {
  if (!relativeDay) {
    return null;
  }

  const now = dayjs().tz(DEFAULT_TIMEZONE);
  const label = RELATIVE_DAY_LABELS[relativeDay] ?? relativeDay;

  switch (relativeDay) {
    case 'today': {
      const start = now.startOf('day');
      const end = now.endOf('day');
      return { start: start.toDate(), end: end.toDate(), label };
    }
    case 'tonight': {
      const start = now.startOf('day');
      const eveningStart = start.add(18, 'hour');
      const end = now.endOf('day');
      return { start: eveningStart.toDate(), end: end.toDate(), label };
    }
    case 'tomorrow': {
      const target = now.add(1, 'day');
      return {
        start: target.startOf('day').toDate(),
        end: target.endOf('day').toDate(),
        label
      };
    }
    case 'day-after-tomorrow': {
      const target = now.add(2, 'day');
      return {
        start: target.startOf('day').toDate(),
        end: target.endOf('day').toDate(),
        label
      };
    }
    case 'yesterday': {
      const target = now.subtract(1, 'day');
      return {
        start: target.startOf('day').toDate(),
        end: target.endOf('day').toDate(),
        label
      };
    }
    case 'this-week': {
      const isoMondayOffset = (now.day() + 6) % 7;
      const monday = now.subtract(isoMondayOffset, 'day').startOf('day');
      const sunday = monday.add(6, 'day').endOf('day');
      return { start: monday.toDate(), end: sunday.toDate(), label };
    }
    case 'next-week': {
      const isoMondayOffset = (now.day() + 6) % 7;
      const monday = now.subtract(isoMondayOffset, 'day').startOf('day').add(7, 'day');
      const sunday = monday.add(6, 'day').endOf('day');
      return { start: monday.toDate(), end: sunday.toDate(), label };
    }
    default:
      return null;
  }
}

function createMention(jid: string): string {
  const phone = phoneFromJid(jid);
  return phone ? `@${phone}` : '@teman';
}

function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)}-${end.slice(0, 5)}`;
}

function describeScheduleFilters(filters?: IntentFilters): string | null {
  if (!filters) {
    return null;
  }

  const parts: string[] = [];

  if (filters.relativeDay) {
    parts.push(RELATIVE_DAY_LABELS[filters.relativeDay] ?? filters.relativeDay);
  }

  const explicitDay = parseDayKeyword(filters.day);
  if (explicitDay) {
    parts.push(`hari ${WEEKDAY_LABELS[explicitDay].label}`);
  }

  if (filters.query) {
    parts.push(`kata kunci "${filters.query}"`);
  }

  return parts.length ? parts.join(', ') : null;
}

function describeAssignmentFilters(filters?: IntentFilters): string | null {
  if (!filters) {
    return null;
  }

  const parts: string[] = [];

  if (filters.subject) {
    parts.push(`mata kuliah "${filters.subject}"`);
  }

  if (filters.relativeDay) {
    parts.push(`deadline ${RELATIVE_DAY_LABELS[filters.relativeDay] ?? filters.relativeDay}`);
  }

  const explicitDay = parseDayKeyword(filters.day);
  if (explicitDay) {
    parts.push(`jadwal hari ${WEEKDAY_LABELS[explicitDay].label}`);
  }

  return parts.length ? parts.join(', ') : null;
}

function describeGroupFilters(filters?: IntentFilters): string | null {
  if (!filters) {
    return null;
  }

  const parts: string[] = [];

  if (filters.group) {
    parts.push(`kelompok ${filters.group}`);
  }

  if (filters.groupQuery) {
    parts.push(`kata kunci "${filters.groupQuery}"`);
  }

  const explicitDay = parseDayKeyword(filters.day);
  if (explicitDay) {
    parts.push(`jadwal hari ${WEEKDAY_LABELS[explicitDay].label}`);
  }

  if (filters.relativeDay) {
    parts.push(RELATIVE_DAY_LABELS[filters.relativeDay] ?? filters.relativeDay);
  }

  if (filters.subject) {
    parts.push(`mata kuliah "${filters.subject}"`);
  }

  return parts.length ? parts.join(', ') : null;
}

function formatDueLabel(dueAt: Date | string): string {
  const now = dayjs().tz(DEFAULT_TIMEZONE);
  const due = dayjs(dueAt).tz(DEFAULT_TIMEZONE);

  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE
  }).format(due.toDate());

  const diffMinutes = due.diff(now, 'minute');
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 1) {
    return `${formatted} (baru saja)`;
  }

  const suffix = diffMinutes >= 0 ? 'lagi' : 'lalu';

  if (absMinutes < 60) {
    return `${formatted} (${absMinutes} menit ${suffix})`;
  }

  if (absMinutes < 1440) {
    const hours = Math.round(absMinutes / 60);
    return `${formatted} (${hours} jam ${suffix})`;
  }

  const days = Math.round(absMinutes / 1440);
  return `${formatted} (${days} hari ${suffix})`;
}

export async function POST(request: NextRequest) {
  if (!INTERNAL_SECRET || request.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { intent?: IntentPayload; context?: ContextPayload } | null = null;

  try {
    body = (await request.json()) as { intent?: IntentPayload; context?: ContextPayload } | null;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const intent = body?.intent ?? null;
  const context = body?.context;

  if (!context?.groupJid || !context.senderJid) {
    return NextResponse.json({});
  }

  if (!context.classId) {
    const classRecord = await prisma.class.findFirst({
      where: {
        groupJid: context.groupJid
      }
    });
    context.classId = classRecord?.id ?? null;
  }

  if (intent?.name === 'register') {
    const result = await handleRegister(context);
    return NextResponse.json(result);
  }

  if (!intent) {
    return NextResponse.json({});
  }

  if (intent.name === 'schedule') {
    const result = await handleSchedule(intent, context);
    return NextResponse.json(result);
  }

  if (intent.name === 'assignment') {
    const result = await handleAssignment(intent, context);
    return NextResponse.json(result);
  }

  if (intent.name === 'groupMembers') {
    const result = await handleGroupMembers(intent, context);
    return NextResponse.json(result);
  }

  if (intent.name === 'group') {
    const result = await handleGroup(intent, context);
    return NextResponse.json(result);
  }

  return NextResponse.json({});
}

async function handleSchedule(intent: NonNullIntent, context: ContextPayload): Promise<IntentReply> {
  const mention = createMention(context.senderJid);
  const mentions = [context.senderJid];

  if (!context.classId) {
    return {
      message: `${mention} 🔌 grup ini belum nyambung ke kelas mana pun. Minta admin buat jalankan *@unibot register* dulu ya.`,
      mentions
    };
  }

  const filters = intent.filters ?? {};
  const weekday = resolveWeekdayFromFilters(filters);
  const queryTerm = filters.query?.trim();

  const where: Prisma.ScheduleWhereInput = {
    classId: context.classId
  };

  if (weekday) {
    where.dayOfWeek = weekday;
  }

  if (queryTerm) {
    where.OR = [
      { title: { contains: queryTerm, mode: 'insensitive' } },
      { description: { contains: queryTerm, mode: 'insensitive' } },
      { room: { contains: queryTerm, mode: 'insensitive' } }
    ];
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ],
    take: MAX_RESULTS + 1,
    select: {
      id: true,
      title: true,
      room: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true
    }
  });

  if (!schedules.length) {
    const detail = describeScheduleFilters(filters);
    const hint = detail ? ` (${detail})` : '';
    return {
      message: `${mention} 🙈 belum nemu jadwal${hint}. Cobain kata kunci lain atau cek lagi di dashboard ya.`,
      mentions
    };
  }

  const visible = schedules.slice(0, MAX_RESULTS);
  const headerDetail = describeScheduleFilters(filters);
  const header = headerDetail
    ? `${mention} 🗓️ ini jadwal ${headerDetail}:`
    : `${mention} 🗓️ ini jadwal yang ketemu:`;

  const items = visible.map((schedule) => {
    const title = schedule.title?.trim() || 'Tanpa judul';
    const label = WEEKDAY_LABELS[schedule.dayOfWeek].short;
    const time = formatTimeRange(schedule.startTime, schedule.endTime);
    const room = schedule.room?.trim();
    const roomText = room ? ` · ${room}` : '';
    return `${label} ${time} · ${title}${roomText}`;
  });

  const lines: string[] = [header, formatList(items)];

  if (schedules.length > visible.length) {
    lines.push(`(+${schedules.length - visible.length} jadwal lagi, sebut nama hari atau matkul biar lebih spesifik)`);
  }

  lines.push('Kalau mau jadwal lain, tag aku lagi aja ya 🙌');

  return {
    message: lines.join('\n'),
    mentions
  };
}

async function handleAssignment(intent: NonNullIntent, context: ContextPayload): Promise<IntentReply> {
  const mention = createMention(context.senderJid);
  const mentions = [context.senderJid];

  if (!context.classId) {
    return {
      message: `${mention} 🔌 grup ini belum terhubung ke kelas. Suruh admin jalanin *@unibot register* dulu ya.`,
      mentions
    };
  }

  const filters = intent.filters ?? {};
  const searchTerm = (filters.subject ?? filters.query)?.trim();
  const dateRange = getRelativeDateRange(filters.relativeDay);
  const weekday = resolveWeekdayFromFilters(filters);

  const where: Prisma.AssignmentWhereInput = {
    classId: context.classId
  };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { schedule: { is: { title: { contains: searchTerm, mode: 'insensitive' } } } }
    ];
  }

  if (dateRange) {
    where.dueAt = {
      gte: dateRange.start,
      lte: dateRange.end
    };
  }

  if (weekday) {
    where.schedule = {
      is: {
        dayOfWeek: weekday
      }
    };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: [
      { dueAt: 'asc' },
      { createdAt: 'desc' }
    ],
    take: MAX_RESULTS + 1,
    select: {
      id: true,
      title: true,
      description: true,
      dueAt: true,
      schedule: {
        select: {
          title: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      }
    }
  });

  if (!assignments.length) {
    const detail = describeAssignmentFilters(filters);
    const rangeHint = dateRange ? ` untuk ${dateRange.label}` : '';
    const info = detail ? ` (${detail})` : rangeHint;
    return {
      message: `${mention} ✅ lagi aman, belum ada tugas${info || ''}. Kalau ada info baru tinggal kabarin aku lagi ya.`,
      mentions
    };
  }

  const visible = assignments.slice(0, MAX_RESULTS);
  const headerDetail = describeAssignmentFilters(filters);
  const header = headerDetail
    ? `${mention} 📚 daftar tugas ${headerDetail}:`
    : `${mention} 📚 ini tugas yang lagi jalan:`;

  const items = visible.map((assignment) => {
    const title = assignment.title?.trim() || 'Tanpa judul';
    const dueLabel = assignment.dueAt ? formatDueLabel(assignment.dueAt) : 'deadline belum di-set';
    const schedule = assignment.schedule;

    if (schedule) {
      const label = WEEKDAY_LABELS[schedule.dayOfWeek].short;
      const time = formatTimeRange(schedule.startTime, schedule.endTime);
      const scheduleTitle = schedule.title?.trim();
      const scheduleInfo = scheduleTitle ? `${scheduleTitle} (${label} ${time})` : `${label} ${time}`;
      return `📌 ${title} · ${scheduleInfo} — ${dueLabel}`;
    }

    return `📌 ${title} — ${dueLabel}`;
  });

  const lines: string[] = [header, formatList(items)];

  if (assignments.length > visible.length) {
    lines.push(`(+${assignments.length - visible.length} tugas lagi, sebut nama matkul buat nge-filter)`);
  }

  lines.push('Kalau butuh update baru, tinggal tag aku lagi 👍');

  return {
    message: lines.join('\n'),
    mentions
  };
}

async function handleGroup(intent: NonNullIntent, context: ContextPayload): Promise<IntentReply> {
  const mention = createMention(context.senderJid);
  const mentions = [context.senderJid];

  if (!context.classId) {
    return {
      message: `${mention} 🔌 grup ini belum terdaftar ke kelas. Ajak admin buat jalankan *@unibot register* dulu ya.`,
      mentions
    };
  }

  const filters = intent.filters ?? {};
  const weekday = resolveWeekdayFromFilters(filters);
  const searchTerm = (filters.group ?? filters.groupQuery ?? filters.subject ?? filters.query)?.trim();

  const scheduleFilter: Prisma.ScheduleWhereInput = {
    classId: context.classId
  };

  if (weekday) {
    scheduleFilter.dayOfWeek = weekday;
  }

  const where: Prisma.GroupWhereInput = {
    schedule: {
      is: scheduleFilter
    }
  };

  if (searchTerm) {
    where.AND = [
      {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { schedule: { is: { title: { contains: searchTerm, mode: 'insensitive' } } } }
        ]
      }
    ];
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }],
    take: MAX_RESULTS + 1,
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true
        }
      },
      schedule: {
        select: {
          title: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      }
    }
  });

  if (!groups.length) {
    const detail = describeGroupFilters(filters);
    const hint = detail ? ` (${detail})` : '';
    return {
      message: `${mention} 🤷‍♂️ belum ada data kelompok${hint}. Coba cek lagi di dashboard atau pakai nama lain ya.`,
      mentions
    };
  }

  const visible = groups.slice(0, MAX_RESULTS);
  const headerDetail = describeGroupFilters(filters);
  const header = headerDetail
    ? `${mention} 👥 ini data kelompok ${headerDetail}:`
    : `${mention} 👥 ini kelompok yang tercatat:`;

  const items = visible.map((group) => {
    const memberCount = group.members.length;
    const memberLabel = memberCount === 0 ? 'belum ada anggota' : `${memberCount} anggota`;
    const schedule = group.schedule;

    if (schedule) {
      const label = WEEKDAY_LABELS[schedule.dayOfWeek].short;
      const time = formatTimeRange(schedule.startTime, schedule.endTime);
      const title = schedule.title?.trim();
      const scheduleInfo = title ? `${label} ${time} · ${title}` : `${label} ${time}`;
      return `👥 ${group.name} — ${memberLabel} · ${scheduleInfo}`;
    }

    return `👥 ${group.name} — ${memberLabel}`;
  });

  const lines: string[] = [header, formatList(items)];

  if (groups.length > visible.length) {
    lines.push(`(+${groups.length - visible.length} kelompok lagi, sebut nama tim biar lebih fokus)`);
  }

  lines.push('Mau cek kelompok lain? Tinggal tag aku lagi 😄');

  return {
    message: lines.join('\n'),
    mentions
  };
}

async function handleGroupMembers(intent: NonNullIntent, context: ContextPayload): Promise<IntentReply> {
  const mention = createMention(context.senderJid);
  const mentions = [context.senderJid];

  if (!context.classId) {
    return {
      message: `${mention} 🔌 grup ini belum terdaftar ke kelas. Ajak admin buat jalankan *@unibot register* dulu ya.`,
      mentions
    };
  }

  const filters = intent.filters ?? {};
  const weekday = resolveWeekdayFromFilters(filters);
  const searchTerm = (filters.group ?? filters.groupQuery ?? filters.subject ?? filters.query)?.trim();

  const scheduleFilter: Prisma.ScheduleWhereInput = {
    classId: context.classId
  };

  if (weekday) {
    scheduleFilter.dayOfWeek = weekday;
  }

  const where: Prisma.GroupWhereInput = {
    schedule: {
      is: scheduleFilter
    }
  };

  if (searchTerm) {
    where.AND = [
      {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { schedule: { is: { title: { contains: searchTerm, mode: 'insensitive' } } } },
          { members: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } }
        ]
      }
    ];
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }],
    take: MEMBER_GROUP_LIMIT + 1,
    select: {
      id: true,
      name: true,
      schedule: {
        select: {
          title: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      },
      members: {
        orderBy: [{ createdAt: 'asc' }],
        select: {
          name: true,
          phone: true
        }
      }
    }
  });

  if (!groups.length) {
    const detail = describeGroupFilters(filters);
    const hint = detail ? ` (${detail})` : '';
    return {
      message: `${mention} 🙈 belum nemu anggota kelompok${hint}. Coba sebut nama tim atau nomor lain ya.`,
      mentions
    };
  }

  const visible = groups.slice(0, MEMBER_GROUP_LIMIT);
  const headerDetail = describeGroupFilters(filters);
  const header = headerDetail
    ? `${mention} 🧑‍🤝‍🧑 ini anggota ${headerDetail}:`
    : `${mention} 🧑‍🤝‍🧑 ini daftar anggota kelompok:`;

  const summaries = visible.map((group) => {
    const schedule = group.schedule;
    const scheduleInfo = schedule
      ? `${WEEKDAY_LABELS[schedule.dayOfWeek].short} ${formatTimeRange(schedule.startTime, schedule.endTime)}${
          schedule.title ? ` · ${schedule.title}` : ''
        }`
      : null;

    const memberEntries = group.members.slice(0, MAX_MEMBER_RESULTS).map((member) => {
      const name = member.name.trim();
      const phone = member.phone?.trim();
      return phone ? `${name} (${phone})` : name;
    });

    const extraMembers = group.members.length - memberEntries.length;
    const memberSummary = memberEntries.length
      ? `${memberEntries.join(', ')}${extraMembers > 0 ? ` (+${extraMembers} lagi)` : ''}`
      : 'belum ada anggota';

    const headerLine = scheduleInfo ? `👥 ${group.name} · ${scheduleInfo}` : `👥 ${group.name}`;
    return `${headerLine}\n   Anggota: ${memberSummary}`;
  });

  const lines: string[] = [header, ...summaries];

  if (groups.length > visible.length) {
    lines.push(`(+${groups.length - visible.length} kelompok lagi, sebut nama tim biar lebih spesifik)`);
  }

  lines.push('Mau cek anggota lain? Tinggal tag aku lagi ya ✨');

  return {
    message: lines.join('\n'),
    mentions
  };
}

async function handleRegister(context: ContextPayload): Promise<IntentReply> {
  const { groupJid, senderJid } = context;
  const mention = createMention(senderJid);
  const mentions = [senderJid];

  if (!groupJid.endsWith('@g.us')) {
    return {
      message: `${mention} 🙏 perintah register cuma bisa dipakai di dalam grup ya.`,
      mentions
    };
  }

  const classCandidate = await prisma.class.findFirst({
    where: {
      groupJid: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (!classCandidate) {
    return {
      message: `${mention} 🙇‍♀️ belum ada kelas yang nunggu aktivasi. Coba kabarin superadmin dulu ya.`,
      mentions
    };
  }

  const updated = await prisma.class.update({
    where: {
      id: classCandidate.id
    },
    data: {
      groupJid
    }
  });

  const classLabel = updated.name ?? updated.id;

  return {
    message: `${mention} 🎉 kelas ${classLabel} udah resmi nyambung ke grup ini. Thanks udah bantu setup!`,
    mentions,
    register: {
      classId: updated.id
    }
  };
}
