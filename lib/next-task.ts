import type { Priority, TaskStatus } from "@/lib/types";

export interface NextTaskCandidate {
  id: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Deterministic "what's next" selection (PLAN.md "Next Action"): no ranking
 * model, just a fixed tiebreak order —
 *   1. in-progress beats not-started
 *   2. higher priority
 *   3. has a due date, and among those, the earlier one
 *   4. the older task
 */
export function pickNextTask<T extends NextTaskCandidate>(tasks: T[]): T | null {
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length === 0) return null;

  const sorted = open.slice().sort((a, b) => {
    const aActive = a.status === "in_progress";
    const bActive = b.status === "in_progress";
    if (aActive !== bActive) return aActive ? -1 : 1;

    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (pw !== 0) return pw;

    if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 1;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }

    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });

  return sorted[0] ?? null;
}
