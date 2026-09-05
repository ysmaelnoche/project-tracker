/**
 * Task-ref linking: matches a GitHub commit message, branch name, or pull
 * request title/body against the `TSK-####` identifier the database already
 * generates for every task (see `lib/types.ts` / `next_task_ref` in
 * `supabase/migrations/0001_init.sql`). Pure and dependency-free, so it's
 * trivial to unit test without a database or a GitHub API call.
 *
 * Matching is case-insensitive (real branch names are conventionally
 * lowercase, e.g. `tsk-0102-rls-policies`) but every resolved ref is
 * normalized to the canonical uppercase form the `tasks.ref` column actually
 * stores, so lookups against it always succeed regardless of how the text on
 * GitHub happened to be cased.
 */

import type { TaskStatus } from "@/lib/types";

export const TASK_REF_PATTERN = /TSK-\d{4}/i;

export interface TaskRefEntry {
  id: string;
  status: TaskStatus;
}

/** ref (e.g. "TSK-0102") -> the task it identifies. */
export type TaskRefMap = ReadonlyMap<string, TaskRefEntry>;

/** The first `TSK-####` reference found in a single string, or null. */
export function extractTaskRef(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(TASK_REF_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

/**
 * The first `TSK-####` reference found across several candidate strings,
 * checked in order (e.g. a PR's title, then its body).
 */
export function findTaskRef(...texts: Array<string | null | undefined>): string | null {
  for (const text of texts) {
    const ref = extractTaskRef(text);
    if (ref) return ref;
  }
  return null;
}

/** Resolves a `TSK-####` reference found in `text` to its full task entry. */
export function resolveTaskEntry(
  text: string | null | undefined,
  tasksByRef: TaskRefMap,
): TaskRefEntry | null {
  const ref = extractTaskRef(text);
  if (!ref) return null;
  return tasksByRef.get(ref) ?? null;
}

/** Resolves a `TSK-####` reference found in `text` to just its task id. */
export function resolveTaskId(
  text: string | null | undefined,
  tasksByRef: TaskRefMap,
): string | null {
  return resolveTaskEntry(text, tasksByRef)?.id ?? null;
}
