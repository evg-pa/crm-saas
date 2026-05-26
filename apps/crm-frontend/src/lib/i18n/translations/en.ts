/** English translations for CRM UI. */

/** Recursively widen literal types to their base primitives. */
export type WidenLiterals<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? WidenLiterals<U>[]
        : { [K in keyof T]: WidenLiterals<T[K]> };

const en = {
  // ── Navigation ──────────────────────────────────────────────────
  nav: {
    dashboard: "Dashboard",
    contacts: "Contacts",
    companies: "Companies",
    deals: "Deals",
    activities: "Activities",
    settings: "Settings",
  },

  // ── Common UI ───────────────────────────────────────────────────
  common: {
    search: "Search...",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    previous: "Previous",
    next: "Next",
    loading: "Loading...",
    noResults: "No results found.",
    showing: "Showing",
    of: "of",
    all: "All",
    none: "—",
    actions: "Actions",
    clear: "Clear",
    close: "Close",
    back: "Back",
    error: "Error",
    success: "Success",
    required: "Required",
  },

  // ── Dashboard ───────────────────────────────────────────────────
  dashboard: {
    title: "Dashboard",
    description: "Overview of your CRM",
    totalContacts: "Total Contacts",
    totalCompanies: "Total Companies",
    totalDeals: "Total Deals",
    totalActivities: "Total Activities",
    recentActivities: "Recent Activities",
    recentDeals: "Recent Deals",
    noData: "No data available",
  },

  // ── Contacts ────────────────────────────────────────────────────
  contacts: {
    title: "Contacts",
    description: "{count} total contacts",
    noDescription: "Manage your contacts",
    searchPlaceholder: "Search contacts by name or email...",
    name: "Name",
    email: "Email",
    title_field: "Title",
    company: "Company",
    created: "Created",
    addContact: "Add Contact",
    newContact: "New Contact",
    editContact: "Edit Contact",
    noContacts: "No contacts yet",
    noContactsDesc: "Create your first contact to get started.",
    contactCreated: 'Contact "{name}" created',
    contactDeleted: 'Contact "{name}" deleted',
    contactUpdated: 'Contact "{name}" updated',
    createError: "Failed to create contact",
    deleteError: "Failed to delete contact",
    loadError: "Failed to load contacts",
    loadErrorDetail: "An unexpected error occurred",
  },

  // ── Companies ───────────────────────────────────────────────────
  companies: {
    title: "Companies",
    description: "{count} total companies",
    noDescription: "Manage your companies",
    searchPlaceholder: "Search companies by name or industry...",
    name: "Name",
    industry: "Industry",
    size: "Size",
    website: "Website",
    created: "Created",
    allIndustries: "All Industries",
    addCompany: "Add Company",
    newCompany: "New Company",
    editCompany: "Edit Company",
    noCompanies: "No companies yet",
    noCompaniesDesc:
      "Create your first company to start tracking relationships, deals, and contacts.",
    companyCreated: 'Company "{name}" created',
    companyDeleted: 'Company "{name}" deleted',
    createError: "Failed to create company",
    deleteError: "Failed to delete company",
    loadError: "Failed to load companies",
  },

  // ── Deals ───────────────────────────────────────────────────────
  deals: {
    title: "Deals",
    description: "{count} total deals",
    noDescription: "Manage your deals and pipeline",
    searchPlaceholder: "Search deals by name...",
    name: "Name",
    amount: "Amount",
    stage: "Stage",
    contact: "Contact",
    company: "Company",
    closeDate: "Close Date",
    allStages: "All Stages",
    addDeal: "Add Deal",
    newDeal: "New Deal",
    editDeal: "Edit Deal",
    noDeals: "No deals yet",
    noDealsDesc: "Create your first deal to start tracking your pipeline.",
    dealCreated: 'Deal "{name}" created',
    dealDeleted: 'Deal "{name}" deleted',
    createError: "Failed to create deal",
    deleteError: "Failed to delete deal",
    loadError: "Failed to load deals",
  },

  // ── Activities ──────────────────────────────────────────────────
  activities: {
    title: "Activities",
    description: "{count} total activities",
    noDescription: "Track your team's activity",
    searchPlaceholder: "Search activities by subject...",
    type: "Type",
    subject: "Subject",
    descField: "Description",
    contact: "Contact",
    deal: "Deal",
    date: "Date",
    allTypes: "All Types",
    addActivity: "Add Activity",
    newActivity: "New Activity",
    editActivity: "Edit Activity",
    noActivities: "No activities yet",
    noActivitiesDesc: "Log your first activity to start tracking your team's work.",
    activityCreated: 'Activity "{name}" created',
    createError: "Failed to create activity",
  },

  // ── Settings ────────────────────────────────────────────────────
  settings: {
    title: "Settings",
    description: "Manage your preferences and account.",
    organization: "Organization",
    organizationDesc: "Your organization details",
    appearance: "Appearance",
    appearanceDesc: "Choose your preferred theme",
    profile: "Profile",
    profileDesc: "Your account information",
    language: "Language",
    languageDesc: "Choose your preferred language",
    english: "English",
    russian: "Русский",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    themeSystemDesc: "Theme follows your system preference.",
    themeDarkDesc: "Dark mode is active.",
    themeLightDesc: "Light mode is active.",
    member: "Member",
    activeSession: "Active session",
    orgId: "Organization ID",
    slug: "Slug",
    activeAccount: "Active account",
    orgLoadError: "Failed to load organization",
    orgLoadErrorDetail: "Organization data is currently unavailable.",
    user: "CRM User",
  },

  // ── Auth / Login ────────────────────────────────────────────────
  auth: {
    loginTitle: "Welcome to CRM",
    loginSubtitle: "Sign in to your workspace",
    loginButton: "Sign In",
    loginLoading: "Signing in...",
    loginError: "Invalid credentials",
    loginErrorDetail: "Please check your email and password.",
    logout: "Log out",
  },

  // ── Deal Stages ─────────────────────────────────────────────────
  dealStages: {
    new: "New",
    discovery: "Discovery",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  },

  // ── Activity Types ──────────────────────────────────────────────
  activityTypes: {
    call: "Call",
    email: "Email",
    meeting: "Meeting",
    note: "Note",
    task: "Task",
    follow_up: "Follow-up",
  },

  // ── Forms / Validation ──────────────────────────────────────────
  forms: {
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    address: "Address",
    website: "Website",
    amount: "Amount",
    expectedCloseDate: "Expected Close Date",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDesc: "This action cannot be undone.",
    openRowActions: "Open row actions",
    selectAll: "Select all rows",
    selectRow: "Select row {row}",
  },

  // ── Formatting ──────────────────────────────────────────────────
  formatting: {
    currency: "USD",
    locale: "en-US",
  },
} as const;

export default en;
export type Translations = WidenLiterals<typeof en>;
