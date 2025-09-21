import { z } from 'zod';

import { WEEKDAYS } from '../weekdays';

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Waktu harus dalam format 24 jam (HH:MM)');

export const scheduleInputSchema = z
  .object({
    title: z.string().min(1, 'Judul wajib diisi').max(120, 'Judul terlalu panjang').trim(),
    description: z.string().max(280, 'Deskripsi maksimal 280 karakter').optional(),
    room: z.string().max(64, 'Nama ruangan maksimal 64 karakter').optional(),
    dayOfWeek: z.enum(WEEKDAYS),
    startTime: timeSchema,
    endTime: timeSchema
  })
  .refine((data) => data.endTime > data.startTime, {
    path: ['endTime'],
    message: 'Jam selesai harus setelah jam mulai'
  });

export type ScheduleInput = z.infer<typeof scheduleInputSchema>;
