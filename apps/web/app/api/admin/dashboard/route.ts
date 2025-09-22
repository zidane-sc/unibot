import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { hasActiveSession } from '../../../../lib/auth';
import { now } from '../../../../lib/time';
import {
  WEEKDAY_TO_DAYJS_INDEX,
  sortByWeekdayAndStartTime
} from '../../../../lib/weekdays';
import type { Weekday } from '../../../../lib/weekdays';
import type {
  AdminClass,
  AssignmentRecord,
  ScheduleRecord,
  UpcomingSchedule
} from '../../../admin/types';

export async function GET(_request: NextRequest) {
  const session = await getSession();
  const userId = session.userId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  type ClassWithRelations = Prisma.ClassGetPayload<{
    select: {
      id: true;
      name: true;
      description: true;
      schedules: {
        select: {
          id: true;
          title: true;
          description: true;
          room: true;
          dayOfWeek: true;
          startTime: true;
          endTime: true;
        };
      };
      assignments: {
        select: {
          id: true;
          title: true;
          description: true;
          dueAt: true;
          scheduleId: true;
          schedule: {
            select: {
              id: true;
              title: true;
              dayOfWeek: true;
              startTime: true;
              endTime: true;
            };
          };
        };
      };
    };
  }>;


  const classes: ClassWithRelations[] = await prisma.class.findMany({
    where: {
      members: {
        some: {
          userId,
          role: 'admin'
        }
      }
    },
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
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      },
      assignments: {
        select: {
          id: true,
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
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const adminClasses: AdminClass[] = classes.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    schedules: item.schedules
      .map((schedule) => ({
        id: schedule.id,
        classId: item.id,
        title: schedule.title,
        description: schedule.description,
        room: schedule.room,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }))
      .sort(sortByWeekdayAndStartTime),
    assignments: item.assignments
      .map((assignment) => ({
        id: assignment.id,
        classId: item.id,
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
      }))
      .sort(compareAssignmentsByDueDate)
  }));

  const totalSchedules = adminClasses.reduce((acc, current) => acc + current.schedules.length, 0);
  const totalAssignments = adminClasses.reduce((acc, current) => acc + current.assignments.length, 0);
  const upcoming = findUpcomingSchedule(adminClasses);

  return NextResponse.json({
    classes: adminClasses,
    stats: {
      classCount: adminClasses.length,
      totalSchedules,
      totalAssignments
    },
    upcoming
  });
}

function compareAssignmentsByDueDate(a: AssignmentRecord, b: AssignmentRecord) {
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
}

function findUpcomingSchedule(classes: AdminClass[]): UpcomingSchedule | null {
  const reference = now();
  let candidate: { schedule: ScheduleRecord; className: string; start: ReturnType<typeof now> } | null = null;

  for (const item of classes) {
    for (const schedule of item.schedules) {
      const nextOccurrence = computeNextOccurrence(schedule, reference);

      if (!nextOccurrence) {
        continue;
      }

      if (!candidate || nextOccurrence.isBefore(candidate.start)) {
        candidate = {
          schedule,
          className: item.name ?? 'Kelas tanpa nama',
          start: nextOccurrence
        };
      }
    }
  }

  if (!candidate) {
    return null;
  }

  return {
    schedule: candidate.schedule,
    className: candidate.className,
    startDateIso: candidate.start.toISOString()
  };
}

function computeNextOccurrence(schedule: ScheduleRecord, reference: ReturnType<typeof now>) {
  const [hour, minute] = schedule.startTime.split(':').map((value) => Number.parseInt(value, 10));

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const targetDayIndex = WEEKDAY_TO_DAYJS_INDEX[schedule.dayOfWeek];
  const dayDifference = (targetDayIndex - reference.day() + 7) % 7;

  let candidate = reference
    .set('hour', hour)
    .set('minute', minute)
    .set('second', 0)
    .set('millisecond', 0)
    .add(dayDifference, 'day');

  if (dayDifference === 0 && candidate.isBefore(reference)) {
    candidate = candidate.add(7, 'day');
  }

  return candidate;
}
