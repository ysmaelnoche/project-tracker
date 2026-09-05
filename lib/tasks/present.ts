/**
 * Pure display-derivation for task rows and the New Task form's project picker.
 * No I/O — callers (Server Components) fetch rows/projects via
 * `lib/tasks/queries.ts` and pass them in here. Mirrors the reference's `decT`
 * and `projectOptions` (design/Shipyard.reference.html).
 */
import { diffDays, formatStamp, isOverdue, relativeUpcoming } from "@/lib/format";
import type { ProjectStatus, ProjectType, Task } from "@/lib/types";

/** Just the project columns the Tasks slice needs — see PLAN.md's guidance to
 * read projects directly here rather than building a shared projects service. */
export interface ProjectLite {
  id: string;
  ref: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
}

/** The DB trigger `enforce_task_project_started` is the real guard; this is the
 * proactive UI check backing it up (PLAN.md "Project Task Business Rule"). */
export function isProjectLocked(status: ProjectStatus): boolean {
  return status === "pending";
}

// Stage labels shown in the project picker's meta column for an unlocked
// project. Kept as a small local copy (rather than importing a UI component
// into lib/) — must stay in sync with components/ui/StageBadge.tsx's stageLabel().
const STAGE_LABEL: Record<ProjectStatus, string> = {
  pending: "STANDBY",
  in_development: "BUILD",
  production: "DEPLOYED",
  paused: "HOLD",
  archived: "DECOMM",
};

export interface ProjectOptionView {
  id: string;
  label: string;
  meta: string;
  disabled: boolean;
}

/**
 * Options for the New Task form's project picker: archived projects are
 * dropped entirely (can't take new tasks), a pending project stays visible
 * but disabled with a "LOCKED" marker instead of disappearing silently.
 */
export function buildProjectOptions(projects: ProjectLite[]): ProjectOptionView[] {
  return projects
    .filter((p) => p.status !== "archived")
    .map((p) => ({
      id: p.id,
      label: `${p.ref}  ${p.name}`,
      meta: isProjectLocked(p.status) ? "⚠ LOCKED" : STAGE_LABEL[p.status],
      disabled: isProjectLocked(p.status),
    }));
}

export type TaskRowTone = "done" | "overdue" | "normal";

export interface TaskRowView {
  id: string;
  ref: string;
  title: string;
  done: boolean;
  inProgress: boolean;
  ctxLabel: string;
  rightLabel: string;
  tone: TaskRowTone;
}

/**
 * Decorates one task for display in the Queue list: completion/overdue
 * state, the right-side meta text, and the context label. A project task's
 * context label joins to the project only for display — the Personal/Work
 * type is never duplicated onto the task row itself.
 */
export function decorateTaskRow(task: Task, project: ProjectLite | null, today: string): TaskRowView {
  const done = task.status === "done";
  const overdue = isOverdue(task.dueDate, today, done);

  let rightLabel = "";
  let tone: TaskRowTone = "normal";
  if (done) {
    rightLabel = `✓ ${formatStamp(task.completedAt)}`;
    tone = "done";
  } else if (overdue && task.dueDate) {
    rightLabel = `⚠ OVERDUE T+${diffDays(task.dueDate, today)}`;
    tone = "overdue";
  } else if (task.dueTime) {
    rightLabel = task.dueTime;
  } else if (task.dueDate) {
    rightLabel = relativeUpcoming(task.dueDate, today);
  }

  const ctxLabel = project
    ? `${task.ref} · ${project.ref} ${project.name.toUpperCase()} · ${project.type === "personal" ? "PERSONAL" : "WORK"}`
    : `${task.ref} · STANDALONE · PERSONAL`;

  return {
    id: task.id,
    ref: task.ref,
    title: task.title,
    done,
    inProgress: task.status === "in_progress",
    ctxLabel,
    rightLabel,
    tone,
  };
}
