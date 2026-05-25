import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  website: z.string().max(500).nullable().optional(),
  industry: z.string().max(200).nullable().optional(),
  size: z.number().int().min(0).nullable().optional(),
  address: z.string().nullable().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
