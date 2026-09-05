/**
 * Project progress, derived from its tasks (PLAN.md "Project Progress") — never a
 * manually-entered percentage.
 */

import type { TaskStatus } from "@/lib/types";

export interface TaskProgress {
  done: number;
  total: number;
  /** 0-100, rounded. 0 (not NaN) when there are no tasks. */
  percent: number;
}

export function computeTaskProgress(tasks: Array<{ status: TaskStatus }>): TaskProgress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
