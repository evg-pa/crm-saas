import { z } from 'zod';

export const userUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(255).nullable().optional(),
  role: z.enum(['admin', 'manager', 'member']).optional(),
  is_active: z.boolean().optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
