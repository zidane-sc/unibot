import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { hasActiveSession } from '../../../../../lib/auth';
import { groupInputSchema } from '../../../../../lib/validation/group';
import { loadGroupForAdmin } from '../../../../../lib/admin';
import { normalizeHints } from '../../../../../lib/hints';
import type { GroupRecord } from '../../../../admin/types';
import type { Weekday } from '../../../../../lib/weekdays';

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const groupId = params.groupId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!groupId) {
    return NextResponse.json({ error: 'ID grup tidak valid' }, { status: 400 });
  }

  const { group: existingGroup, allowed, exists, classId } = await loadGroupForAdmin(userId, groupId);

  if (!exists) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingGroup || !classId) {
    return NextResponse.json({ error: 'Akses ke grup ini ditolak' }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = groupInputSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? 'Permintaan tidak valid' }, { status: 400 });
  }

  const targetSchedule = await prisma.schedule.findFirst({
    where: {
      id: parsed.data.scheduleId,
      classId
    },
    select: { id: true }
  });

  if (!targetSchedule) {
    return NextResponse.json({ error: 'Jadwal mata kuliah tidak ditemukan' }, { status: 400 });
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      name: parsed.data.name.trim(),
      hints: normalizeHints(parsed.data.hints),
      scheduleId: parsed.data.scheduleId
    },
    select: {
      id: true,
      name: true,
      hints: true,
      scheduleId: true,
      schedule: {
        select: {
          id: true,
          classId: true,
          title: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      },
      members: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  return NextResponse.json({ group: serializeGroup(updated, classId) });
}

export async function DELETE(_request: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const groupId = params.groupId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!groupId) {
    return NextResponse.json({ error: 'ID grup tidak valid' }, { status: 400 });
  }

  const { allowed, exists, classId } = await loadGroupForAdmin(userId, groupId);

  if (!exists) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !classId) {
    return NextResponse.json({ error: 'Akses ke grup ini ditolak' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.groupMember.deleteMany({ where: { groupId } }),
    prisma.group.delete({ where: { id: groupId } })
  ]);

  return NextResponse.json({ ok: true, classId });
}

function serializeGroup(
  group: {
    id: string;
    name: string;
    hints: string[];
    scheduleId: string | null;
    schedule: {
      id: string;
      classId: string;
      title: string | null;
      dayOfWeek: Weekday;
      startTime: string;
      endTime: string;
    } | null;
    members: {
      id: string;
      name: string;
      phone: string | null;
    }[];
  },
  fallbackClassId: string
): GroupRecord {
  const schedule = group.schedule;
  const classId = schedule?.classId ?? fallbackClassId;

  return {
    id: group.id,
    name: group.name,
    classId,
    scheduleId: group.scheduleId,
    hints: group.hints,
    schedule: schedule
      ? {
          id: schedule.id,
          title: schedule.title,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }
      : null,
    members: group.members
      .map((member) => ({
        id: member.id,
        groupId: group.id,
        name: member.name,
        phone: member.phone
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'))
  };
}
