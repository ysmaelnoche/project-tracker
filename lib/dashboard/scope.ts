/**
 * Personal/Work "scope" filter shared across the Dashboard (PLAN.md "Personal
 * and Work Dashboard Views"). Lives in the URL (`?scope=`), same as the Fleet
 * page. Mirrors the design reference's `scopeOk`/`taskScopeOk` exactly,
 * including the quirk that a standalone task (no project) counts as
 * "personal" for scope purposes rather than being scope-less.
 */

import type { ProjectType } from "@/lib/types";

export type DashboardScope = "all" | ProjectType;

/** Defensive parse of the `?scope=` search param — falls back to "all". */
export function parseScope(value: string | undefined | null): DashboardScope {
  return value === "personal" || value === "work" ? value : "all";
}

export function projectMatchesScope(scope: DashboardScope, type: ProjectType): boolean {
  return scope === "all" || type === scope;
}

/**
 * A standalone task (no parent project) is treated as "personal" for scope
 * purposes — it never matches the "work" scope, but does match "personal"
 * and "all".
 */
export function taskMatchesScope(scope: DashboardScope, projectType: ProjectType | null): boolean {
  if (scope === "all") return true;
  if (!projectType) return scope === "personal";
  return projectType === scope;
}
