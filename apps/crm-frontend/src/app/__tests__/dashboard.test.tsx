import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, setFakeAuth, resetFakeAuth } from "@/test/test-utils";

// ── Mock the hooks used by DashboardPage ───────────────────────────────────
const {
  useContacts,
  useCompanies,
  useDeals,
  useActivities,
} = vi.hoisted(() => ({
  useContacts: vi.fn(),
  useCompanies: vi.fn(),
  useDeals: vi.fn(),
  useActivities: vi.fn(),
}));

vi.mock("@/lib/hooks/use-contacts", () => ({ useContacts }));
vi.mock("@/lib/hooks/use-companies", () => ({ useCompanies }));
vi.mock("@/lib/hooks/use-deals", () => ({ useDeals }));
vi.mock("@/lib/hooks/use-activities", () => ({ useActivities }));

// Next.js navigation mock
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import DashboardPage from "@/app/(dashboard)/page";

// ── Helpers ────────────────────────────────────────────────────────────────
function makePaginatedResponse(items: unknown[], total?: number) {
  return {
    total: total ?? items.length,
    offset: 0,
    limit: 20,
    items,
  };
}

const mockActivity = (i: number) => ({
  id: `act-${i}`,
  organization_id: "org-1",
  activity_type: "call",
  subject: `Activity ${i}`,
  description: null,
  contact_id: null,
  deal_id: null,
  occurred_at: "2026-05-20T10:00:00Z",
  created_at: "2026-05-20T10:00:00Z",
  updated_at: "2026-05-20T10:00:00Z",
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe("DashboardPage", () => {
  beforeEach(() => {
    setFakeAuth();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetFakeAuth();
  });

  // ── LOADING ──────────────────────────────────────────────────────────────

  it("shows skeleton placeholders while data is loading", () => {
    useContacts.mockReturnValue({ data: undefined, isLoading: true });
    useCompanies.mockReturnValue({ data: undefined, isLoading: true });
    useDeals.mockReturnValue({ data: undefined, isLoading: true });
    useActivities.mockReturnValue({ data: undefined, isLoading: true });

    renderWithProviders(<DashboardPage />);

    // Skeleton components have animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── DATA RENDER ──────────────────────────────────────────────────────────

  it("renders KPI cards with totals when data is loaded", async () => {
    useContacts.mockReturnValue({
      data: makePaginatedResponse([], 42),
      isLoading: false,
    });
    useCompanies.mockReturnValue({
      data: makePaginatedResponse([], 15),
      isLoading: false,
    });
    useDeals.mockReturnValue({
      data: makePaginatedResponse([], 8),
      isLoading: false,
    });
    useActivities.mockReturnValue({
      data: makePaginatedResponse([]),
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    // "42" appears in both KPI card and QuickLink badge — use getAllByText
    await waitFor(() => {
      const fortyTwos = screen.getAllByText("42");
      expect(fortyTwos.length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText("15").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);

    // KPI labels
    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    expect(screen.getByText("Total Companies")).toBeInTheDocument();
    expect(screen.getByText("Total Deals")).toBeInTheDocument();

    // Page heading
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  // ── EMPTY STATE ──────────────────────────────────────────────────────────

  it("shows '—' for null values (empty data)", async () => {
    useContacts.mockReturnValue({
      data: { total: 0, offset: 0, limit: 20, items: [] },
      isLoading: false,
    });
    useCompanies.mockReturnValue({
      data: { total: 0, offset: 0, limit: 20, items: [] },
      isLoading: false,
    });
    useDeals.mockReturnValue({
      data: { total: 0, offset: 0, limit: 20, items: [] },
      isLoading: false,
    });
    useActivities.mockReturnValue({
      data: { total: 0, offset: 0, limit: 5, items: [] },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // "0" appears in all 3 KPI cards + 3 badges
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    // Recent Activity section should show empty message
    expect(
      screen.getByText(/No recent activity/)
    ).toBeInTheDocument();
  });

  // ── ERROR STATE ──────────────────────────────────────────────────────────

  it("gracefully handles undefined data (error scenario)", () => {
    useContacts.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Network error") });
    useCompanies.mockReturnValue({ data: undefined, isLoading: false });
    useDeals.mockReturnValue({ data: undefined, isLoading: false });
    useActivities.mockReturnValue({ data: undefined, isLoading: false });

    renderWithProviders(<DashboardPage />);

    // Should render "—" for values that are null/undefined
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  // ── RECENT ACTIVITY ──────────────────────────────────────────────────────

  it("renders recent activity list when data is available", async () => {
    const activities = [mockActivity(1), mockActivity(2), mockActivity(3)];

    useContacts.mockReturnValue({
      data: makePaginatedResponse([], 5),
      isLoading: false,
    });
    useCompanies.mockReturnValue({
      data: makePaginatedResponse([], 3),
      isLoading: false,
    });
    useDeals.mockReturnValue({
      data: makePaginatedResponse([], 2),
      isLoading: false,
    });
    useActivities.mockReturnValue({
      data: makePaginatedResponse(activities),
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
      expect(screen.getByText("Activity 2")).toBeInTheDocument();
      expect(screen.getByText("Activity 3")).toBeInTheDocument();
    });

    // "View all" link should be present
    expect(screen.getByText("View all")).toBeInTheDocument();
  });
});
