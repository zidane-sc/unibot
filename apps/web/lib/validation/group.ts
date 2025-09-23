import { z } from 'zod';

import { hintsSchema } from './hints';

const phoneRegex = /^\+?\d{9,15}$/;

export const groupInputSchema = z.object({
  name: z.string().min(1, 'Nama grup wajib diisi').max(160, 'Nama grup terlalu panjang').trim(),
  hints: hintsSchema.optional(),
  scheduleId: z.string({ required_error: 'Pilih jadwal mata kuliah' }).uuid('Jadwal tidak valid')
});

export const groupMemberInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama anggota wajib diisi')
    .max(160, 'Nama anggota terlalu panjang')
    .trim(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || phoneRegex.test(value), {
      message: 'Nomor telepon harus 9-15 digit dan dapat diawali +'
    })
});

export type GroupInput = z.infer<typeof groupInputSchema>;
export type GroupMemberInput = z.infer<typeof groupMemberInputSchema>;
