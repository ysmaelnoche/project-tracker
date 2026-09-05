/**
 * Maps a raw Postgres/Supabase error to clean, user-facing copy. Never show a
 * raw exception to the user (PLAN.md "Error States"). The pending-project rule
 * is really enforced by the `tasks_enforce_project_started` trigger in
 * supabase/migrations/0001_init.sql — the New Task form's picker disables
 * pending projects proactively, so hitting this path server-side means a
 * stale form (e.g. the project changed status in another tab) slipped past
 * the UI guard, not that the guard is being relied on alone.
 */

interface PostgrestLikeError {
  code?: string | null;
  message?: string | null;
}

const PENDING_PROJECT_MESSAGE =
  "Development hasn't started yet. Start development before creating tasks for this project.";

const GENERIC_MESSAGE = "Something went wrong saving that task. Try again.";

export function toFriendlyTaskError(error: PostgrestLikeError | null | undefined): string {
  if (!error) return GENERIC_MESSAGE;

  const message = error.message ?? "";
  const isPendingProjectViolation =
    error.code === "23514" || /has not started development/i.test(message);

  return isPendingProjectViolation ? PENDING_PROJECT_MESSAGE : GENERIC_MESSAGE;
}
