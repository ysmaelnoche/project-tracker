/**
 * "My Day" and "Upcoming"/"Inbound" bucketing (PLAN.md "My Day" / "Upcoming").
 * Pure — the caller has already fetched + scope-filtered tasks/projects.
 */

import { relativeUpcoming } from "@/lib/format";
import type { TaskStatus } from "@/lib/types";

export interface MyDayTaskInput {
  status: TaskStatus;
  dueDate: string | null;
}

/**
 * "My Day": overdue tasks first, then tasks due today — each bucket keeping
 * its incoming order (mirrors the design reference's `overdue.concat(dueToday)`).
 */
export function selectMyDayTasks<T extends MyDayTaskInput>(tasks: T[], today: string): T[] {
  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate !== null && t.dueDate < today);
  const dueToday = open.filter((t) => t.dueDate === today);
  return [...overdue, ...dueToday];
}

export interface UpcomingTaskInput {
  status: TaskStatus;
  dueDate: string | null;
  title: string;
  contextLabel: string;
}

export interface UpcomingMilestoneInput {
  title: string;
  targetDate: string;
}

export interface UpcomingEntry {
  when: string;
  title: string;
  ctx: string;
  isMilestone: boolean;
}

/**
 * "Upcoming"/"Inbound": open tasks due strictly after today, soonest first,
 * capped at `taskCap`; then every active project's future target date is
 * appended as a milestone entry (unsorted relative to the tasks — matches the
 * design reference exactly, which simply pushes milestones onto the end); the
 * combined list is capped at `cap`.
 */
export function buildUpcoming(
  tasks: UpcomingTaskInput[],
  milestones: UpcomingMilestoneInput[],
  today: string,
  taskCap = 5,
  cap = 6,
): UpcomingEntry[] {
  const taskEntries: UpcomingEntry[] = tasks
    .filter((t) => t.status !== "done" && t.dueDate !== null && t.dueDate > today)
    .slice()
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))
    .slice(0, taskCap)
    .map((t) => ({
      when: relativeUpcoming(t.dueDate!, today),
      title: t.title,
      ctx: t.contextLabel,
      isMilestone: false,
    }));

  const milestoneEntries: UpcomingEntry[] = milestones
    .filter((m) => m.targetDate > today)
    .map((m) => ({
      when: relativeUpcoming(m.targetDate, today),
      title: `Target deployment — ${m.title}`,
      ctx: "MILESTONE",
      isMilestone: true,
    }));

  return [...taskEntries, ...milestoneEntries].slice(0, cap);
}
