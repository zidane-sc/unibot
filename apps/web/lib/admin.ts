import prisma from './prisma';

export async function isClassAdmin(userId: string, classId: string): Promise<boolean> {
  if (!userId || !classId) {
    return false;
  }

  const membership = await prisma.classMember.findFirst({
    where: {
      userId,
      classId,
      role: 'admin'
    },
    select: { id: true }
  });

  return Boolean(membership);
}

export async function loadScheduleForAdmin(userId: string, scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
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

  if (!schedule) {
    return {
      exists: false,
      allowed: false,
      schedule: null
    } as const;
  }

  const allowed = await isClassAdmin(userId, schedule.classId);

  return {
    exists: true,
    allowed,
    schedule: allowed ? schedule : null
  } as const;
}

export async function loadAssignmentForAdmin(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
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

  if (!assignment) {
    return {
      exists: false,
      allowed: false,
      assignment: null
    } as const;
  }

  const allowed = await isClassAdmin(userId, assignment.classId);

  return {
    exists: true,
    allowed,
    assignment: allowed ? assignment : null
  } as const;
}
