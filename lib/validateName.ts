// ---------------------------------------------------------------------------
// Shared name-entry validation. Both FateBox (the randomiser panel) and
// SubmitBar (the survival list's submit form) ask for a name and apply the
// same rule: trim, cap at MAX_NAME_LENGTH, and reject empty/whitespace-only
// input. Keeping this in one place means the two forms can't silently drift.
// ---------------------------------------------------------------------------

export const MAX_NAME_LENGTH = 40;

export const NAME_REQUIRED_ERROR = '> ERROR: NAME REQUIRED';

/**
 * Trim and cap raw input to MAX_NAME_LENGTH. Returns null if the result is
 * empty, so callers can treat that as "no name entered".
 */
export function resolveName(raw: string): string | null {
  const trimmed = raw.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed ? trimmed : null;
}

/**
 * Whether two names refer to the same person for the purposes of re-submitting.
 *
 * Compared trimmed and case-insensitively, so "  john smith " updates the entry
 * stored as "John Smith" rather than sitting beside it as a near-duplicate. The
 * stored spelling is never overwritten — the first submission's casing wins.
 */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}
