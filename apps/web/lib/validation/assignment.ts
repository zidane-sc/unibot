import { z } from 'zod';

export const assignmentInputSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(160, 'Judul terlalu panjang').trim(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  dueAt: z
    .union([z.string().datetime({ message: 'Tanggal tenggat tidak valid' }), z.null()])
    .optional()
});

export type AssignmentInput = z.infer<typeof assignmentInputSchema>;
