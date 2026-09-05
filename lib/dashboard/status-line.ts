/**
 * The `<ScopeBar statusLine>` summary shown on every `(app)` page (not just
 * the Dashboard): "FLEET n · BUILD n · QUEUE n · ALERTS n". Counts mirror the
 * Overview metrics bar's FLEET/IN BUILD/ALERTS tiles, plus a QUEUE count of
 * every open task (project + standalone) — global, not scope-filtered, same
 * as the metrics bar.
 */

import { pad2 } from "@/lib/format";
import type { ProjectStatus, TaskStatus } from "@/lib/types";

export interface StatusLineCounts {
  fleet: number;
  build: number;
  queue: number;
  alerts: number;
}

export function computeStatusLineCounts(
  projects: { status: ProjectStatus }[],
  tasks: { status: TaskStatus; dueDate: string | null }[],
  today: string,
): StatusLineCounts {
  const fleet = projects.filter((p) => p.status !== "archived").length;
  const build = projects.filter((p) => p.status === "in_development").length;
  const openTasks = tasks.filter((t) => t.status !== "done");
  const queue = openTasks.length;
  const alerts = openTasks.filter((t) => t.dueDate !== null && t.dueDate < today).length;
  return { fleet, build, queue, alerts };
}

export function formatStatusLine(counts: StatusLineCounts): string {
  return `FLEET ${pad2(counts.fleet)} · BUILD ${pad2(counts.build)} · QUEUE ${pad2(counts.queue)} · ALERTS ${pad2(counts.alerts)}`;
}
