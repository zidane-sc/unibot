import { z } from 'zod';

export const hintsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Hint tidak boleh kosong')
      .max(48, 'Hint maksimal 48 karakter')
  )
  .max(10, 'Maksimal 10 hint');

export type HintsInput = z.infer<typeof hintsSchema>;
