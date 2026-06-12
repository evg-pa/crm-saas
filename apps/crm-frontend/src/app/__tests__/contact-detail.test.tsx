import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, setFakeAuth, resetFakeAuth } from "@/test/test-utils";

// ── Mock hooks ─────────────────────────────────────────────────────────────
const { useContact, useUpdateContact, useDeleteContact } = vi.hoisted(() => ({
  useContact: vi.fn(),
  useUpdateContact: vi.fn(),
  useDeleteContact: vi.fn(),
}));

vi.mock("@/lib/hooks/use-contacts", () => ({
  useContact,
  useUpdateContact,
  useDeleteContact,
}));

// Contact detail page renders ContactForm which uses useCompanies
const { useCompany, useCompanies } = vi.hoisted(() => ({
  useCompany: vi.fn(),
  useCompanies: vi.fn(),
}));
vi.mock("@/lib/hooks/use-companies", () => ({ useCompany, useCompanies }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: "contact-1" }),
}));

import ContactDetailPage from "@/app/(dashboard)/contacts/[id]/page";

// ── Helpers ────────────────────────────────────────────────────────────────
const mockContact = {
  id: "contact-1",
  organization_id: "org-1",
  first_name: "Alice",
  last_name: "Johnson",
  email: "alice@example.com",
  phone: "+1 555-1234",
  title: "CTO",
  company_id: "company-1",
  created_at: "2026-05-20T10:00:00Z",
  updated_at: "2026-05-22T14:00:00Z",
};

const mockCompany = {
  id: "company-1",
  organization_id: "org-1",
  name: "Acme Corp",
  website: "https://acme.com",
  industry: "Tech",
  size: 500,
  address: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe("ContactDetailPage", () => {
  beforeEach(() => {
    setFakeAuth();
    vi.clearAllMocks();
    useUpdateContact.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useDeleteContact.mockReturnValue({ mutate: vi.fn(), isPending: false });
    // ContactForm inside the detail page imports useCompanies
    useCompanies.mockReturnValue({ data: { items: [] }, isLoading: false });
  });

  afterEach(() => {
    resetFakeAuth();
  });

  // ── LOADING ──────────────────────────────────────────────────────────────

  it("shows skeleton UI while loading", () => {
    useContact.mockReturnValue({ data: undefined, isLoading: true });
    useCompany.mockReturnValue({ data: undefined, isLoading: true });

    renderWithProviders(<ContactDetailPage />);

    // Skeleton components have animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── DATA RENDER ──────────────────────────────────────────────────────────

  it("renders contact details when data is loaded", async () => {
    useContact.mockReturnValue({
      data: mockContact,
      isLoading: false,
      isError: false,
    });
    useCompany.mockReturnValue({
      data: mockCompany,
      isLoading: false,
    });

    renderWithProviders(<ContactDetailPage />);

    await waitFor(() => {
      // Full name
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      // Title badge
      expect(screen.getByText("CTO")).toBeInTheDocument();
      // Email
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      // Phone
      expect(screen.getByText("+1 555-1234")).toBeInTheDocument();
      // Company name
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Back button
    expect(screen.getByText("Back to Contacts")).toBeInTheDocument();

    // Section headings
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  // ── ERROR / NOT FOUND ────────────────────────────────────────────────────

  it("shows error state when contact fails to load", async () => {
    useContact.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Not found"),
    });
    useCompany.mockReturnValue({ data: undefined });

    renderWithProviders(<ContactDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load contact")).toBeInTheDocument();
    });
  });

  // ── NULL FIELDS ──────────────────────────────────────────────────────────

  it("shows '—' for null fields", async () => {
    useContact.mockReturnValue({
      data: {
        ...mockContact,
        email: null,
        phone: null,
        title: null,
        company_id: null,
      },
      isLoading: false,
      isError: false,
    });
    useCompany.mockReturnValue({ data: undefined });

    renderWithProviders(<ContactDetailPage />);

    await waitFor(() => {
      // No title badge rendered
      expect(screen.queryByText("CTO")).not.toBeInTheDocument();
    });

    // Email/Phone/Company labels should be present but values should be —
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
