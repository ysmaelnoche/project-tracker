/**
 * Pure project-lifecycle derivations (PLAN.md "Project Lifecycle" / "Pending
 * Projects" / "Paused Projects" / "Archived Projects"). Kept dependency-free so
 * they're trivial to unit test and safe to call from both Server Actions and
 * Server Components.
 */

import { diffDays, formatStamp } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";

/**
 * What status a project should return to on restore from archived.
 *
 * The Shipyard design reference's `restore()` collapses every archived project
 * back to only "pending" or "production" (`published ? 'production' : 'pending'`).
 * That silently loses "this project was actively in development" for anything
 * archived out of in_development/paused — a bug in the prototype, not intended
 * behavior. We derive from the fields that already exist instead: a project
 * that was ever developed keeps that history on restore.
 */
export function deriveRestoreStatus(
  project: Pick<Project, "publishedDate" | "devStartDate">,
): ProjectStatus {
  if (project.publishedDate) return "production";
  if (project.devStartDate) return "in_development";
  return "pending";
}

/** PLAN.md "Project Task Business Rule": tasks can't be created while pending. */
export function isTaskCreationLocked(status: ProjectStatus): boolean {
  return status === "pending";
}

/** Pause/resume only ever moves between these two statuses. */
export function canTogglePause(status: ProjectStatus): boolean {
  return status === "in_development" || status === "paused";
}

/** Progress-gauge color, shared between the Fleet card and Project Detail. */
export function projectGaugeTone(status: ProjectStatus): "accent" | "teal" | "faint" {
  if (status === "production") return "teal";
  if (status === "paused" || status === "archived") return "faint";
  return "accent";
}

export interface StageStripStep {
  step: "01" | "02" | "03";
  code: "STANDBY" | "BUILD" | "DEPLOYED";
  value: string;
  note: string;
  state: "done" | "active" | "upcoming";
}

const STAGE_INDEX: Record<ProjectStatus, number> = {
  pending: 0,
  in_development: 1,
  paused: 1,
  archived: 1,
  production: 2,
};

const NO_DATE = "——.——.——";

/**
 * The three-step Standby / Build / Deployed strip on Project Detail, mirroring
 * the Shipyard reference's `pd.stages`.
 */
export function deriveStageStrip(
  project: Pick<Project, "status" | "devStartDate" | "publishedDate" | "targetDate">,
  today: string,
): StageStripStep[] {
  const activeIndex = STAGE_INDEX[project.status];

  const steps: Array<Omit<StageStripStep, "state">> = [
    {
      step: "01",
      code: "STANDBY",
      value: project.devStartDate ? "CLEARED" : "HOLDING",
      note: project.devStartDate ? "REGISTERED" : "BUILD NOT STARTED",
    },
    {
      step: "02",
      code: "BUILD",
      value: project.devStartDate ? formatStamp(project.devStartDate) : NO_DATE,
      note: project.devStartDate
        ? project.publishedDate
          ? "BUILD WINDOW OPENED"
          : `T+${diffDays(project.devStartDate, today)} DAYS ELAPSED`
        : "UNLOCKS ON INITIATE",
    },
    {
      step: "03",
      code: "DEPLOYED",
      value: project.publishedDate
        ? formatStamp(project.publishedDate)
        : project.targetDate
          ? formatStamp(project.targetDate)
          : NO_DATE,
      note: project.publishedDate
        ? project.devStartDate
          ? `${diffDays(project.devStartDate, project.publishedDate)} DAYS TOTAL`
          : "DEPLOYED"
        : project.targetDate
          ? "TARGET DATE"
          : "NO TARGET SET",
    },
  ];

  return steps.map((s, i) => ({
    ...s,
    state: i === activeIndex ? "active" : i < activeIndex ? "done" : "upcoming",
  }));
}
