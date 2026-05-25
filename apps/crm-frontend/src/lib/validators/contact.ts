import { z } from "zod";

export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  company_id: z.string().uuid("Invalid company ID").nullable().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
