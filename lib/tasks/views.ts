/**
 * Pure "Queue" view/filter/sort logic for the Tasks slice — no I/O, so it's
 * unit-testable without a database. Mirrors the design reference's `viewDef`,
 * `byView`, `ctxDef`/`ctxOk`, the `taskRows` sort, and `emptyCopy`
 * (design/Shipyard.reference.html, search "byView"/"emptyCopy").
 */
import { pad2, isOverdue } from "@/lib/format";
import type { Task } from "@/lib/types";

export type TaskView = "today" | "upcoming" | "overdue" | "all" | "completed";
export type TaskContext = "all" | "project" | "standalone";

export const TASK_VIEW_DEFS: { key: TaskView; label: string }[] = [
  { key: "today", label: "TODAY" },
  { key: "upcoming", label: "INBOUND" },
  { key: "overdue", label: "ALERTS" },
  { key: "all", label: "ALL OPEN" },
  { key: "completed", label: "CLOSED" },
];

export const TASK_CONTEXT_DEFS: { key: TaskContext; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "project", label: "PROJECT" },
  { key: "standalone", label: "STANDALONE" },
];

/** Defensive parse of the `?view=` search param — falls back to "today". */
export function parseTaskView(value: string | undefined | null): TaskView {
  return TASK_VIEW_DEFS.some((v) => v.key === value) ? (value as TaskView) : "today";
}

/** Defensive parse of the `?context=` search param — falls back to "all". */
export function parseTaskContext(value: string | undefined | null): TaskContext {
  return TASK_CONTEXT_DEFS.some((c) => c.key === value) ? (value as TaskContext) : "all";
}

/** "2026-09-05" style local-date stamp for a given instant (default: now). */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function filterTasksByContext(tasks: Task[], context: TaskContext): Task[] {
  if (context === "standalone") return tasks.filter((t) => !t.projectId);
  if (context === "project") return tasks.filter((t) => !!t.projectId);
  return tasks;
}

function isOpenTask(task: Task): boolean {
  return task.status !== "done";
}

/**
 * Buckets tasks into one Queue view. Note "today" deliberately rolls overdue
 * tasks in too (due <= today) — matches the reference so nothing already late
 * can hide from the default tab.
 */
export function bucketTasksByView(tasks: Task[], view: TaskView, today: string): Task[] {
  switch (view) {
    case "today":
      return tasks.filter((t) => isOpenTask(t) && !!t.dueDate && t.dueDate <= today);
    case "upcoming":
      return tasks.filter((t) => isOpenTask(t) && !!t.dueDate && t.dueDate > today);
    case "overdue":
      return tasks.filter((t) => isOpenTask(t) && isOverdue(t.dueDate, today, false));
    case "completed":
      return tasks.filter((t) => t.status === "done");
    case "all":
      return tasks.filter(isOpenTask);
  }
}

/** Tab badge counts — each view counted independently against the same list. */
export function countsByView(tasks: Task[], today: string): Record<TaskView, number> {
  const counts = {} as Record<TaskView, number>;
  for (const v of TASK_VIEW_DEFS) {
    counts[v.key] = bucketTasksByView(tasks, v.key, today).length;
  }
  return counts;
}

/**
 * Display order within a view: tasks with a due date first (earliest first),
 * then tasks without one. Ties keep their incoming order (stable) — matches
 * the reference's `taskRows` sort exactly.
 */
export function sortTaskRows<T extends { dueDate: string | null }>(tasks: T[]): T[] {
  return tasks
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const aDue = a.t.dueDate;
      const bDue = b.t.dueDate;
      if (!!aDue !== !!bDue) return aDue ? -1 : 1;
      if (aDue && bDue && aDue !== bDue) return aDue < bDue ? -1 : 1;
      return a.i - b.i;
    })
    .map(({ t }) => t);
}

/**
 * Builds a `/tasks` href for a given view+context pair, omitting a param when
 * it's the default so the URL stays clean (`/tasks`, not `/tasks?view=today`).
 * Shared by TaskViewTabs and ContextFilter so switching one filter preserves
 * the other.
 */
export function buildTaskQueueHref(view: TaskView, context: TaskContext): string {
  const params = new URLSearchParams();
  if (view !== "today") params.set("view", view);
  if (context !== "all") params.set("context", context);
  const qs = params.toString();
  return qs ? `/tasks?${qs}` : "/tasks";
}

/** Exact per-view empty-state copy from the reference's `emptyCopy`. */
export const TASK_VIEW_EMPTY_COPY: Record<TaskView, { eyebrow: string; title: string; body: string }> = {
  today: {
    eyebrow: "QUEUE CLEAR",
    title: "Nothing on today.",
    body: "No deadlines, no alerts. Good window to push a build forward.",
  },
  upcoming: {
    eyebrow: "NO INBOUND",
    title: "The horizon is clear.",
    body: "Nothing scheduled ahead. Set dates only when they matter.",
  },
  overdue: {
    eyebrow: "NO ALERTS",
    title: "All clear.",
    body: "Everything with a deadline is still ahead of you.",
  },
  all: {
    eyebrow: "QUEUE EMPTY",
    title: "No open tasks.",
    body: "Create one, or initiate a build to unlock a project queue.",
  },
  completed: {
    eyebrow: "NO RECORDS",
    title: "Nothing closed yet.",
    body: "Close a task and the system records it here automatically.",
  },
};
