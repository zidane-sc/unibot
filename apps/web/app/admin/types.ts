import type { Weekday } from '../../lib/weekdays';

export type ScheduleRecord = {
  id: string;
  classId: string;
  title: string | null;
  description: string | null;
  room: string | null;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
};

export type AssignmentRecord = {
  id: string;
  classId: string;
  title: string | null;
  description: string | null;
  dueAt: string | null;
  schedule: {
    id: string;
    title: string | null;
    dayOfWeek: Weekday;
    startTime: string;
    endTime: string;
  } | null;
};

export type GroupMemberRecord = {
  id: string;
  groupId: string;
  name: string;
  phone: string | null;
};

export type GroupRecord = {
  id: string;
  name: string;
  classId: string;
  scheduleId: string | null;
  schedule: {
    id: string;
    title: string | null;
    dayOfWeek: Weekday;
    startTime: string;
    endTime: string;
  } | null;
  members: GroupMemberRecord[];
};

export type AdminClass = {
  id: string;
  name: string | null;
  description: string | null;
  schedules: ScheduleRecord[];
  assignments: AssignmentRecord[];
  groups: GroupRecord[];
};

export type DashboardStats = {
  classCount: number;
  totalSchedules: number;
  totalAssignments: number;
};

export type UpcomingSchedule = {
  schedule: ScheduleRecord;
  className: string;
  startDateIso: string;
};

export type AdminDashboardResponse = {
  classes: AdminClass[];
  stats: DashboardStats;
  upcoming: UpcomingSchedule | null;
};
