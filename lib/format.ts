/**
 * Date/number formatting shared across every screen, so "today", "overdue", and
 * "T+n" read consistently everywhere instead of each slice inventing its own.
 * All dates are plain ISO strings ("YYYY-MM-DD") — no timezone math, since due
 * dates are calendar days, not instants.
 */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-09-05" -> "2026.09.05". Returns "" for null/empty input. */
export function formatStamp(isoDate: string | null | undefined): string {
  return isoDate ? isoDate.replaceAll("-", ".") : "";
}

function toUtcDate(isoDate: string): Date {
  const parts = isoDate.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function diffDays(fromIso: string, toIso: string): number {
  const ms = toUtcDate(toIso).getTime() - toUtcDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

export function isOverdue(dueDate: string | null, today: string, done: boolean): boolean {
  return !done && !!dueDate && dueDate < today;
}

/**
 * A compact relative label for an upcoming date: "TODAY", "T+1", "T+6" (within a
 * week), or the plain stamp beyond that / in the past.
 */
export function relativeUpcoming(isoDate: string, today: string): string {
  const d = diffDays(today, isoDate);
  if (d === 0) return "TODAY";
  if (d === 1) return "T+1";
  if (d < 0) return formatStamp(isoDate);
  if (d < 7) return `T+${d}`;
  return formatStamp(isoDate);
}
