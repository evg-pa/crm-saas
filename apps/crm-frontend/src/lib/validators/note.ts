import { z } from 'zod';

export const noteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
});

export type NoteFormValues = z.infer<typeof noteSchema>;
