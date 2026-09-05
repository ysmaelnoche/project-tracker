/**
 * The "Primary Directive" (PLAN.md "Next Action" + the Overview's headline
 * block): the single most urgent thing across every active build. Each
 * project's own next task is picked elsewhere via `pickNextTask`
 * (lib/next-task.ts) — this module only picks the most urgent one *among*
 * those already-picked per-project candidates, mirroring the design
 * reference's `dirTask` derivation exactly:
 *   score = (in_progress ? 0 : 10) + priorityWeight + (overdue ? -5 : 0)
 * lowest score wins; ties keep the first project (stable).
 */

import { diffDays, relativeUpcoming } from "@/lib/format";
import type { Priority, TaskStatus } from "@/lib/types";

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export interface DirectiveTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
}

export interface DirectiveProject {
  id: string;
  ref: string;
  name: string;
  nextTask: DirectiveTask | null;
}

export interface PrimaryDirective {
  projectId: string;
  projectRef: string;
  projectName: string;
  task: DirectiveTask;
  /** Prebuilt "● ACTIVE · HIGH PRIORITY · ⚠ OVERDUE T+2" style meta line. */
  meta: string;
}

function score(task: DirectiveTask, today: string): number {
  const activeScore = task.status === "in_progress" ? 0 : 10;
  const overdueScore = task.dueDate !== null && task.dueDate < today ? -5 : 0;
  return activeScore + PRIORITY_WEIGHT[task.priority] + overdueScore;
}

function buildMeta(task: DirectiveTask, today: string): string {
  const bits: string[] = [];
  if (task.status === "in_progress") bits.push("● ACTIVE");
  bits.push(`${task.priority.toUpperCase()} PRIORITY`);
  if (task.dueDate) {
    bits.push(
      task.dueDate < today
        ? `⚠ OVERDUE T+${diffDays(task.dueDate, today)}`
        : `DUE ${relativeUpcoming(task.dueDate, today)}`,
    );
  } else {
    bits.push("NO DEADLINE");
  }
  return bits.join(" · ");
}

export function pickPrimaryDirective(
  projects: DirectiveProject[],
  today: string,
): PrimaryDirective | null {
  let best: { project: DirectiveProject; task: DirectiveTask; score: number } | null = null;

  for (const project of projects) {
    if (!project.nextTask) continue;
    const s = score(project.nextTask, today);
    if (!best || s < best.score) {
      best = { project, task: project.nextTask, score: s };
    }
  }

  if (!best) return null;

  return {
    projectId: best.project.id,
    projectRef: best.project.ref,
    projectName: best.project.name,
    task: best.task,
    meta: buildMeta(best.task, today),
  };
}
