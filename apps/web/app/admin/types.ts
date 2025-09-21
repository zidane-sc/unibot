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

export type AdminClass = {
  id: string;
  name: string | null;
  description: string | null;
  schedules: ScheduleRecord[];
};

export type DashboardStats = {
  classCount: number;
  totalSchedules: number;
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
