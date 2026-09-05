/**
 * Project bucketing for the Overview's Active Builds / Standby / Deployed
 * sections (PLAN.md "Active Projects", "Pending Projects", "Production
 * Projects"), each respecting the shared `?scope=` filter.
 */

import { projectMatchesScope, type DashboardScope } from "@/lib/dashboard/scope";
import type { ProjectStatus, ProjectType } from "@/lib/types";

export interface SelectableProject {
  status: ProjectStatus;
  type: ProjectType;
}

/** In-development projects — Active Builds. */
export function selectActiveProjects<T extends SelectableProject>(
  projects: T[],
  scope: DashboardScope,
): T[] {
  return projects.filter((p) => p.status === "in_development" && projectMatchesScope(scope, p.type));
}

/** Pending projects — Standby. */
export function selectStandbyProjects<T extends SelectableProject>(
  projects: T[],
  scope: DashboardScope,
): T[] {
  return projects.filter((p) => p.status === "pending" && projectMatchesScope(scope, p.type));
}

export interface DeployableProject extends SelectableProject {
  publishedDate: string | null;
}

/** Most recently published production projects, capped — Deployed. */
export function selectDeployedProjects<T extends DeployableProject>(
  projects: T[],
  scope: DashboardScope,
  cap = 3,
): T[] {
  return projects
    .filter((p) => p.status === "production" && projectMatchesScope(scope, p.type))
    .slice()
    .sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""))
    .slice(0, cap);
}
