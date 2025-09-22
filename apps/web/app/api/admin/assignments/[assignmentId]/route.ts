import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { hasActiveSession } from '../../../../../lib/auth';
import { loadAssignmentForAdmin } from '../../../../../lib/admin';
import { assignmentInputSchema } from '../../../../../lib/validation/assignment';
import type { AssignmentRecord } from '../../../../admin/types';
import type { Weekday } from '../../../../../lib/weekdays';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getSession();
  const userId = session.userId;
  const assignmentId = params.assignmentId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!assignmentId) {
    return NextResponse.json({ error: 'ID tugas tidak valid' }, { status: 400 });
  }

  const { assignment: existingAssignment, allowed, exists } = await loadAssignmentForAdmin(userId, assignmentId);

  if (!exists) {
    return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingAssignment) {
    return NextResponse.json({ error: 'Akses ke tugas ini ditolak' }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = assignmentInputSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? 'Permintaan tidak valid' }, { status: 400 });
  }

  const scheduleRecord = await prisma.schedule.findFirst({
    where: {
      id: parsed.data.scheduleId,
      classId: existingAssignment.classId
    },
    select: { id: true }
  });

  if (!scheduleRecord) {
    return NextResponse.json({ error: 'Jadwal mata kuliah tidak ditemukan' }, { status: 400 });
  }

  const description = parsed.data.description?.trim();
  const dueAtInput = parsed.data.dueAt;
  const dueAt = typeof dueAtInput === 'string' ? new Date(dueAtInput) : null;

  if (dueAt && Number.isNaN(dueAt.getTime())) {
    return NextResponse.json({ error: 'Tanggal tenggat tidak valid' }, { status: 400 });
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: parsed.data.title,
      description: description && description.length > 0 ? description : null,
      dueAt,
      scheduleId: parsed.data.scheduleId
    },
    select: {
      id: true,
      classId: true,
      title: true,
      description: true,
      dueAt: true,
      scheduleId: true,
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
  });

  return NextResponse.json({ assignment: serializeAssignment(updated) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getSession();
  const userId = session.userId;
  const assignmentId = params.assignmentId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!assignmentId) {
    return NextResponse.json({ error: 'ID tugas tidak valid' }, { status: 400 });
  }

  const { assignment: existingAssignment, allowed, exists } = await loadAssignmentForAdmin(userId, assignmentId);

  if (!exists) {
    return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingAssignment) {
    return NextResponse.json({ error: 'Akses ke tugas ini ditolak' }, { status: 403 });
  }

  await prisma.assignment.delete({ where: { id: assignmentId } });

  return NextResponse.json({ ok: true, classId: existingAssignment.classId });
}

function serializeAssignment(assignment: {
  id: string;
  classId: string;
  title: string | null;
  description: string | null;
  dueAt: Date | null;
  schedule: {
    id: string;
    title: string | null;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  } | null;
}): AssignmentRecord {
  return {
    id: assignment.id,
    classId: assignment.classId,
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
    schedule: assignment.schedule
      ? {
          id: assignment.schedule.id,
          title: assignment.schedule.title,
          dayOfWeek: assignment.schedule.dayOfWeek as Weekday,
          startTime: assignment.schedule.startTime,
          endTime: assignment.schedule.endTime
        }
      : null
  };
}
