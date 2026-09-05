/**
 * Pure eligibility logic for permanently deleting a decommissioned project.
 * Decommissioning records `archived_at` (see lib/projects/actions.ts's
 * `archiveProject`); a project becomes eligible for PURGE once
 * `PURGE_GRACE_DAYS` calendar days have passed since then. Restoring a
 * project clears `archived_at`, so re-archiving later restarts the clock.
 *
 * PURGE is never automatic — this only decides whether the button appears
 * and whether the server re-checks pass; the operator always confirms
 * through the countdown sequence (components/projects/PurgeSequence.tsx).
 */

import { diffDays } from "@/lib/format";

export const PURGE_GRACE_DAYS = 14;

/** Whole calendar days since `archivedAt` (a full timestamp), as of `todayIso` (a date). */
function daysSinceArchived(archivedAt: string, todayIso: string): number {
  return diffDays(archivedAt.slice(0, 10), todayIso);
}

export function isPurgeEligible(
  archivedAt: string | null,
  todayIso: string,
  graceDays: number = PURGE_GRACE_DAYS,
): boolean {
  if (!archivedAt) return false;
  return daysSinceArchived(archivedAt, todayIso) >= graceDays;
}

/** Days remaining until purge-eligible, clamped to 0; `null` when not archived at all. */
export function daysUntilPurgeEligible(
  archivedAt: string | null,
  todayIso: string,
  graceDays: number = PURGE_GRACE_DAYS,
): number | null {
  if (!archivedAt) return null;
  return Math.max(graceDays - daysSinceArchived(archivedAt, todayIso), 0);
}
