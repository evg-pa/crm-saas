import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, setFakeAuth, resetFakeAuth } from "@/test/test-utils";

// ── Mock hooks ─────────────────────────────────────────────────────────────
const { useCompanies } = vi.hoisted(() => ({ useCompanies: vi.fn() }));
vi.mock("@/lib/hooks/use-companies", () => ({ useCompanies }));

import { ContactForm } from "@/features/contacts/components/contact-form";
import type { ContactFormValues } from "@/lib/validators/contact";
import type { Contact } from "@/types";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
  contact: null as Contact | null,
};

function renderForm(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(<ContactForm {...defaultProps} {...overrides} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("ContactForm", () => {
  beforeEach(() => {
    setFakeAuth();
    vi.clearAllMocks();
    useCompanies.mockReturnValue({ data: { items: [] } });
  });

  afterEach(() => {
    resetFakeAuth();
  });

  // ── RENDER ───────────────────────────────────────────────────────────────

  it("renders 'New Contact' title in create mode", () => {
    renderForm();
    expect(screen.getByText("New Contact")).toBeInTheDocument();
  });

  it("renders 'Edit Contact' title in edit mode", () => {
    renderForm({
      contact: {
        id: "c1",
        organization_id: "org-1",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: null,
        title: null,
        company_id: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    });
    expect(screen.getByText("Edit Contact")).toBeInTheDocument();
  });

  // ── FORM FIELDS ──────────────────────────────────────────────────────────

  it("renders all form fields", () => {
    renderForm();

    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
  });

  // ── VALIDATION ───────────────────────────────────────────────────────────

  it("shows validation errors for required fields when submitted empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    // Click submit without filling anything
    await user.click(screen.getByText("Create Contact"));

    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Last name is required")).toBeInTheDocument();
    });

    // onSubmit should NOT have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ── SUBMISSION ───────────────────────────────────────────────────────────

  it("calls onSubmit with form values when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/First Name/), "Jane");
    await user.type(screen.getByLabelText(/Last Name/), "Smith");
    await user.type(screen.getByLabelText(/Email/), "jane@example.com");

    await user.click(screen.getByText("Create Contact"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const callArg = onSubmit.mock.calls[0][0] as ContactFormValues;
    expect(callArg.first_name).toBe("Jane");
    expect(callArg.last_name).toBe("Smith");
    expect(callArg.email).toBe("jane@example.com");
  });

  // ── PRE-FILL (EDIT MODE) ─────────────────────────────────────────────────

  it("pre-fills fields with contact data in edit mode", () => {
    const contact = {
      id: "c1",
      organization_id: "org-1",
      first_name: "Bob",
      last_name: "Marley",
      email: "bob@example.com",
      phone: null,
      title: "Musician",
      company_id: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    renderForm({ contact });

    const firstNameInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;

    expect(firstNameInput.value).toBe("Bob");
    expect(lastNameInput.value).toBe("Marley");
    expect(emailInput.value).toBe("bob@example.com");
    expect(titleInput.value).toBe("Musician");
  });

  // ── SUBMITTING STATE ─────────────────────────────────────────────────────

  it("shows 'Saving...' and disables submit when isSubmitting is true", () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  // ── CANCEL ───────────────────────────────────────────────────────────────

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderForm({ onOpenChange });

    await user.click(screen.getByText("Cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
