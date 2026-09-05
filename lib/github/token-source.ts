/**
 * Which GitHub token to actually use, and where it came from — pure decision
 * logic, kept separate from the Supabase/env lookups in client.ts so it's
 * trivially testable. A database-stored token (set via the Config screen)
 * always wins over GITHUB_TOKEN, so switching to the in-app flow doesn't
 * require removing the env var — it just stops being used.
 */

export type GithubTokenSource = "database" | "environment" | "none";

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveGithubToken(
  dbToken: string | null | undefined,
  envToken: string | undefined,
): string | null {
  return clean(dbToken) ?? clean(envToken);
}

export function resolveGithubTokenSource(
  dbToken: string | null | undefined,
  envToken: string | undefined,
): GithubTokenSource {
  if (clean(dbToken)) return "database";
  if (clean(envToken)) return "environment";
  return "none";
}
