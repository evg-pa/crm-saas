// ============================================================
// @app/shared-utils — Shared utility functions
// ============================================================

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

/**
 * Convert a string into a URL-friendly slug.
 *
 * - Lowercases
 * - Replaces non-alphanumeric sequences with a single hyphen
 * - Strips leading / trailing hyphens
 * - Falls back to a default if the result is empty
 */
export function slugify(input: string, fallback = "untitled"): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : fallback;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Loosely checks that a string looks like a UUID. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

/** Checks that the string is a well-formed email address. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** Require a string to be non-empty after trimming. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Require the value to be at most `max` characters. */
export function isMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/** Delay execution for `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safely parse JSON with a fallback value on failure. */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
