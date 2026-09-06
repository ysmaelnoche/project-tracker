import { priorityLabel } from "@/lib/priority";
import type { Priority } from "@/lib/types";

// A high/CRITICAL priority is the one level worth calling out visually — it
// reuses the same red already meaning "needs attention" elsewhere (overdue
// tasks, alerts), rather than inventing a second color for the same idea.
// Routine/standard stay in the same quiet ink tones as every other secondary
// meta label (type, dates) — priority isn't a status, so it doesn't get a
// StageBadge-style mark.
const PRIORITY_CLASS: Record<Priority, string> = {
  low: "text-ink-faint",
  medium: "text-ink-2",
  high: "text-red",
};

/** Compact "ROUTINE/STANDARD/CRITICAL PRIORITY" label — see lib/priority.ts. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`font-mono text-[9px] tracking-[0.14em] ${PRIORITY_CLASS[priority]}`}>
      {priorityLabel(priority)} PRIORITY
    </span>
  );
}
