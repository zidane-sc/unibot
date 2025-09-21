import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../../lib/prisma';
import { getSession } from '../../../../../../lib/session';
import { hasActiveSession } from '../../../../../../lib/auth';
import { isClassAdmin } from '../../../../../../lib/admin';
import { scheduleInputSchema } from '../../../../../../lib/validation/schedule';
import { sortByWeekdayAndStartTime } from '../../../../../../lib/weekdays';

export async function GET(
  _request: NextRequest,
  { params }: { params: { classId: string } }
) {
  const session = await getSession();
  const userId = session.userId;
  const classId = params.classId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!classId) {
    return NextResponse.json({ error: 'ID kelas tidak valid' }, { status: 400 });
  }

  const allowed = await isClassAdmin(userId, classId);

  if (!allowed) {
    return NextResponse.json({ error: 'Akses ke kelas ini ditolak' }, { status: 403 });
  }

  const schedules = await prisma.schedule.findMany({
    where: { classId },
    select: {
      id: true,
      classId: true,
      title: true,
      description: true,
      room: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true
    }
  });

  return NextResponse.json({
    schedules: schedules.map(serializeSchedule).sort(sortByWeekdayAndStartTime)
  });
}

export async function POST(request: NextRequest, { params }: { params: { classId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const classId = params.classId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!classId) {
    return NextResponse.json({ error: 'ID kelas tidak valid' }, { status: 400 });
  }

  const allowed = await isClassAdmin(userId, classId);

  if (!allowed) {
    return NextResponse.json({ error: 'Akses ke kelas ini ditolak' }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = scheduleInputSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? 'Permintaan tidak valid' }, { status: 400 });
  }

  const description = parsed.data.description?.trim();
  const room = parsed.data.room?.trim();

  const schedule = await prisma.schedule.create({
    data: {
      classId,
      title: parsed.data.title,
      description: description && description.length > 0 ? description : null,
      room: room && room.length > 0 ? room : null,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime
    },
    select: {
      id: true,
      classId: true,
      title: true,
      description: true,
      room: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true
    }
  });

  return NextResponse.json({ schedule: serializeSchedule(schedule) }, { status: 201 });
}

function serializeSchedule(schedule: {
  id: string;
  classId: string;
  title: string | null;
  description: string | null;
  room: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}) {
  return {
    id: schedule.id,
    classId: schedule.classId,
    title: schedule.title,
    description: schedule.description,
    room: schedule.room,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime
  };
}
