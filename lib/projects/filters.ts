/**
 * Fleet page filtering (PLAN.md "Projects View"): class (Personal/Work) and
 * stage filters, plus the shared `?scope=` from the layout's ScopeBar layered on
 * top as an additional AND — not an override, so "Personal" class + "Work" scope
 * correctly yields nothing rather than one silently winning.
 */

import type { ProjectStatus, ProjectType } from "@/lib/types";

export type ClassFilter = "all" | ProjectType;
export type StageFilter = "all" | ProjectStatus;
export type ScopeFilter = "all" | ProjectType;

export interface FilterableProject {
  id: string;
  type: ProjectType;
  status: ProjectStatus;
}

export interface ProjectFilters {
  classFilter: ClassFilter;
  stageFilter: StageFilter;
  scope: ScopeFilter;
}

export function filterProjects<T extends FilterableProject>(
  projects: T[],
  { classFilter, stageFilter, scope }: ProjectFilters,
): T[] {
  return projects.filter((p) => {
    if (classFilter !== "all" && p.type !== classFilter) return false;
    if (scope !== "all" && p.type !== scope) return false;
    if (stageFilter === "all") return p.status !== "archived";
    return p.status === stageFilter;
  });
}
