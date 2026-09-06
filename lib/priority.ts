/**
 * Display label for `Priority`, shared by both Projects and Tasks (they use
 * the same enum). Kept as its own module rather than duplicated per slice —
 * a "high" priority project and a "high" priority task must read the same
 * word everywhere, or the scale stops meaning anything.
 *
 * Named to match the rest of the console's shipyard/ops vocabulary
 * (STANDBY/BUILD/DEPLOYED, HOLD, DECOMM) rather than plain LOW/MEDIUM/HIGH —
 * the stored value is still "low"/"medium"/"high" (see lib/types.ts and the
 * `priority` column), only this label changes.
 */
import type { Priority } from "@/lib/types";

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "ROUTINE",
  medium: "STANDARD",
  high: "CRITICAL",
};

export function priorityLabel(priority: Priority): string {
  return PRIORITY_LABEL[priority];
}
