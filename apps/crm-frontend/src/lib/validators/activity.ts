import { z } from 'zod';

export const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'task', 'follow_up'] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const activitySchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES, {
    required_error: 'Activity type is required',
  }),
  subject: z.string().min(1, 'Subject is required').max(500),
  description: z.string().nullable().optional(),
  contact_id: z.string().uuid('Invalid contact ID').nullable().optional(),
  deal_id: z.string().uuid('Invalid deal ID').nullable().optional(),
  occurred_at: z.string().min(1, 'Date is required'),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
