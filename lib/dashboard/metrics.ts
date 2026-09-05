/**
 * The Overview metrics bar (PLAN.md "Dashboard Overview"): six tiles, always
 * computed across every project/task regardless of the `?scope=` filter —
 * mirrors the design reference's `metrics`, which reads from `live`/
 * `openTasks` unfiltered by `taskScopeOk`/`scopeOk`. Only OPEN PRS and the
 * task-derived tiles need data this module doesn't own to join in (the
 * caller passes in a pre-counted PR total).
 */

import { pad2 } from "@/lib/format";
import type { ProjectStatus, TaskStatus } from "@/lib/types";

export type MetricTone = "ink" | "accent" | "teal" | "red";

export interface MetricTile {
  label: string;
  value: string;
  unit: string;
  tone: MetricTone;
}

export interface MetricsProjectInput {
  status: ProjectStatus;
}

export interface MetricsTaskInput {
  status: TaskStatus;
  dueDate: string | null;
}

export function buildMetrics(
  projects: MetricsProjectInput[],
  tasks: MetricsTaskInput[],
  openPrCount: number,
  today: string,
): MetricTile[] {
  const live = projects.filter((p) => p.status !== "archived");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const dueToday = openTasks.filter((t) => t.dueDate === today);
  const overdue = openTasks.filter((t) => t.dueDate !== null && t.dueDate < today);

  return [
    { label: "FLEET", value: pad2(live.length), unit: "RECORDS", tone: "ink" },
    {
      label: "IN BUILD",
      value: pad2(live.filter((p) => p.status === "in_development").length),
      unit: "ACTIVE",
      tone: "accent",
    },
    {
      label: "OPEN PRS",
      value: pad2(openPrCount),
      unit: "IN FLIGHT",
      tone: openPrCount > 0 ? "accent" : "ink",
    },
    {
      label: "DEPLOYED",
      value: pad2(live.filter((p) => p.status === "production").length),
      unit: "LIVE",
      tone: "teal",
    },
    { label: "DUE TODAY", value: pad2(dueToday.length), unit: "TASKS", tone: "ink" },
    {
      label: "ALERTS",
      value: pad2(overdue.length),
      unit: "OVERDUE",
      tone: overdue.length > 0 ? "red" : "ink",
    },
  ];
}
