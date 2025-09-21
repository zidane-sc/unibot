import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../../lib/prisma';
import { getSession } from '../../../../../../lib/session';
import { hasActiveSession } from '../../../../../../lib/auth';
import { loadScheduleForAdmin } from '../../../../../../lib/admin';
import { scheduleInputSchema } from '../../../../../../lib/validation/schedule';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  const session = await getSession();
  const userId = session.userId;
  const scheduleId = params.scheduleId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!scheduleId) {
    return NextResponse.json({ error: 'ID jadwal tidak valid' }, { status: 400 });
  }

  const { schedule: existingSchedule, allowed, exists } = await loadScheduleForAdmin(userId, scheduleId);

  if (!exists) {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingSchedule) {
    return NextResponse.json({ error: 'Akses ke jadwal ini ditolak' }, { status: 403 });
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

  const updated = await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
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

  return NextResponse.json({ schedule: serializeSchedule(updated) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  const session = await getSession();
  const userId = session.userId;
  const scheduleId = params.scheduleId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!scheduleId) {
    return NextResponse.json({ error: 'ID jadwal tidak valid' }, { status: 400 });
  }

  const { schedule: existingSchedule, allowed, exists } = await loadScheduleForAdmin(userId, scheduleId);

  if (!exists) {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingSchedule) {
    return NextResponse.json({ error: 'Akses ke jadwal ini ditolak' }, { status: 403 });
  }

  await prisma.schedule.delete({ where: { id: scheduleId } });

  return NextResponse.json({ ok: true, classId: existingSchedule.classId });
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
