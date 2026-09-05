/**
 * Project progress, derived from its tasks (PLAN.md "Project Progress").
 *
 * Deliberately just a count, not a percentage: a completion percentage
 * treats every task as equal weight, which isn't true and reads as a more
 * precise signal than it is — the operator's own call, not something this
 * app should be computing on their behalf. See design/README.md.
 */

import type { TaskStatus } from "@/lib/types";

export interface TaskProgress {
  done: number;
  total: number;
}

export function computeTaskProgress(tasks: Array<{ status: TaskStatus }>): TaskProgress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { done, total };
}
