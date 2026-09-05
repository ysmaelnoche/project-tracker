/**
 * Whether a *target* date (PENDING/BUILD's forward-looking ship date — not
 * DEPLOYED's deploy date, which is deliberately backdatable, see
 * lib/projects/entry-stage.ts) is acceptable: unset is always fine, it's
 * optional; today or later is always fine. A date already in the past is
 * still fine *only* if it's exactly what's already stored — an overdue
 * target that was set weeks ago shouldn't block an unrelated edit to the
 * same project. Only a *newly chosen* past date is rejected.
 */
export function isValidTargetDate(
  newDate: string | null,
  currentDate: string | null,
  todayIso: string,
): boolean {
  if (!newDate) return true;
  if (newDate >= todayIso) return true;
  return newDate === currentDate;
}
