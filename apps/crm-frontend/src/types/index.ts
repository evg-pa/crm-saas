/** CRM entity types matching the backend API schemas. */

export type UUID = string;
export type ISODateString = string;

// ── Organization ───────────────────────────────────────────────────────────

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ── Contact ────────────────────────────────────────────────────────────────

export interface Contact {
  id: UUID;
  organization_id: UUID;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: UUID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ContactCreate {
  organization_id: UUID;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  company_id?: UUID | null;
}

export interface ContactUpdate {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  company_id?: UUID | null;
}

// ── Company ────────────────────────────────────────────────────────────────

export interface Company {
  id: UUID;
  organization_id: UUID;
  name: string;
  website: string | null;
  industry: string | null;
  size: number | null;
  address: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CompanyCreate {
  organization_id: UUID;
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  address?: string | null;
}

export interface CompanyUpdate {
  name?: string;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  address?: string | null;
}

// ── Deal ───────────────────────────────────────────────────────────────────

export type DealStage =
  | "new"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export const DEAL_STAGES: DealStage[] = [
  "new",
  "discovery",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export interface Deal {
  id: UUID;
  organization_id: UUID;
  name: string;
  amount: number | null;
  stage: string;
  contact_id: UUID | null;
  company_id: UUID | null;
  expected_close_date: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DealCreate {
  organization_id: UUID;
  name: string;
  amount?: number | null;
  stage?: string;
  contact_id?: UUID | null;
  company_id?: UUID | null;
  expected_close_date?: ISODateString | null;
}

export interface DealUpdate {
  name?: string;
  amount?: number | null;
  stage?: string;
  contact_id?: UUID | null;
  company_id?: UUID | null;
  expected_close_date?: ISODateString | null;
}

// ── Activity ───────────────────────────────────────────────────────────────

export interface Activity {
  id: UUID;
  organization_id: UUID;
  activity_type: string;
  subject: string;
  description: string | null;
  contact_id: UUID | null;
  deal_id: UUID | null;
  occurred_at: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ActivityCreate {
  organization_id: UUID;
  activity_type: string;
  subject: string;
  description?: string | null;
  contact_id?: UUID | null;
  deal_id?: UUID | null;
  occurred_at: ISODateString;
}

export interface ActivityUpdate {
  activity_type?: string;
  subject?: string;
  description?: string | null;
  contact_id?: UUID | null;
  deal_id?: UUID | null;
  occurred_at?: ISODateString;
}

// ── Note ───────────────────────────────────────────────────────────────────

export interface Note {
  id: UUID;
  organization_id: UUID;
  contact_id: UUID;
  content: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface NoteCreate {
  organization_id: UUID;
  contact_id: UUID;
  content: string;
}

export interface NoteUpdate {
  content?: string;
}

// ── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}
