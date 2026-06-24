import { z } from 'zod';

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required').max(255),
  amount: z.number().int().min(0).nullable().optional(),
  stage: z.string().min(1).max(50).default('new'),
  contact_id: z.string().uuid('Invalid contact ID').nullable().optional(),
  company_id: z.string().uuid('Invalid company ID').nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
});

export type DealFormValues = z.infer<typeof dealSchema>;
