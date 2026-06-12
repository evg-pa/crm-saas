import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, setFakeAuth, resetFakeAuth } from "@/test/test-utils";

// ── Mock hooks ─────────────────────────────────────────────────────────────
const { useContacts, useCreateContact, useDeleteContact } = vi.hoisted(() => ({
  useContacts: vi.fn(),
  useCreateContact: vi.fn(),
  useDeleteContact: vi.fn(),
}));

vi.mock("@/lib/hooks/use-contacts", () => ({
  useContacts,
  useCreateContact,
  useDeleteContact,
}));

// Mock useCompanies/useCompany (used by ContactForm & CompanyNameCell)
const { useCompanies, useCompany } = vi.hoisted(() => ({
  useCompanies: vi.fn(),
  useCompany: vi.fn(),
}));
vi.mock("@/lib/hooks/use-companies", () => ({ useCompanies, useCompany }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ContactsPage from "@/app/(dashboard)/contacts/page";

// ── Helpers ────────────────────────────────────────────────────────────────
function makePaginated(items: Array<Record<string, unknown>>, total?: number) {
  return { total: total ?? items.length, offset: 0, limit: 20, items };
}

const mockContact = (i: number) => ({
  id: `contact-${i}`,
  organization_id: "org-1",
  first_name: `First${i}`,
  last_name: `Last${i}`,
  email: `user${i}@example.com`,
  phone: null,
  title: i % 2 === 0 ? "Engineer" : null,
  company_id: "11111111-2222-3333-4444-555555555555",
  created_at: "2026-05-20T10:00:00Z",
  updated_at: "2026-05-20T10:00:00Z",
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe("ContactsPage", () => {
  beforeEach(() => {
    setFakeAuth();
    vi.clearAllMocks();
    // Default mock returns for mutations
    useCreateContact.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useDeleteContact.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useCompanies.mockReturnValue({ data: { items: [] } });
    useCompany.mockReturnValue({ data: undefined });
  });

  afterEach(() => {
    resetFakeAuth();
  });

  // ── LOADING ──────────────────────────────────────────────────────────────

  it("shows skeleton rows while loading", () => {
    useContacts.mockReturnValue({ data: undefined, isLoading: true });

    renderWithProviders(<ContactsPage />);

    // DataTable renders Skeleton components with h-4 class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── DATA RENDER ──────────────────────────────────────────────────────────

  it("renders contact rows when data is loaded", async () => {
    const contacts = [mockContact(1), mockContact(2), mockContact(3)];
    useContacts.mockReturnValue({
      data: makePaginated(contacts),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText("First1 Last1")).toBeInTheDocument();
      expect(screen.getByText("First2 Last2")).toBeInTheDocument();
      expect(screen.getByText(/3 total contacts/)).toBeInTheDocument();
    });
  });

  // ── EMPTY STATE ──────────────────────────────────────────────────────────

  it("shows empty state when there are no contacts", async () => {
    useContacts.mockReturnValue({
      data: makePaginated([]),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ContactsPage />);

    await waitFor(() => {
      // EmptyState title (§8.2.4)
      expect(screen.getByText("No contacts yet")).toBeInTheDocument();
      // EmptyState description
      expect(
        screen.getByText("Create your first contact to get started.")
      ).toBeInTheDocument();
    });
  });

  // ── ERROR STATE ──────────────────────────────────────────────────────────

  it("shows error state when the API fails", async () => {
    useContacts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });

    renderWithProviders(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load contacts")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // ── SEARCH ───────────────────────────────────────────────────────────────

  it("has a search input that is accessible", () => {
    useContacts.mockReturnValue({
      data: makePaginated([]),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ContactsPage />);

    const searchInput = screen.getByPlaceholderText("Search contacts by name or email...");
    expect(searchInput).toBeInTheDocument();
  });

  // ── PAGINATION ───────────────────────────────────────────────────────────

  it("shows pagination controls when total exceeds limit", async () => {
    // Create 30 contacts with total=30, limit=20 -> should show pagination
    useContacts.mockReturnValue({
      data: { total: 30, offset: 0, limit: 20, items: [] },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("Previous")).toBeInTheDocument();
    });

    // Previous should be disabled on first page
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  // ── ADD CONTACT BUTTON ───────────────────────────────────────────────────

  it("renders the Add Contact button", () => {
    useContacts.mockReturnValue({
      data: makePaginated([]),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ContactsPage />);
    // PageHeader actions slot + EmptyState CTA both render "Add Contact"
    const buttons = screen.getAllByText("Add Contact");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  // ── DIALOG OPENS ─────────────────────────────────────────────────────────

  it("opens the create contact dialog when Add Contact is clicked", async () => {
    useContacts.mockReturnValue({
      data: makePaginated([]),
      isLoading: false,
      isError: false,
    });
    useCompanies.mockReturnValue({ data: { items: [] } });
    useCompany.mockReturnValue({ data: undefined });

    const user = userEvent.setup();
    renderWithProviders(<ContactsPage />);

    // Click the header button (first match in DOM, has Plus icon)
    const addButtons = screen.getAllByText("Add Contact");
    await user.click(addButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText("New Contact")).toBeInTheDocument();
    });
  });
});
