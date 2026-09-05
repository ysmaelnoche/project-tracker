import "server-only";
import { Octokit } from "@octokit/rest";
import { createClient } from "@/lib/supabase/server";
import { resolveGithubToken, resolveGithubTokenSource, type GithubTokenSource } from "@/lib/github/token-source";

/**
 * The operator's GitHub token: a database-stored one (pasted into the Config
 * screen — see lib/github/actions.ts's saveGithubToken) if set, otherwise
 * GITHUB_TOKEN from the server environment. No GitHub App, no webhooks, per
 * the architecture decision in PLAN.md ("do not build a complicated event
 * pipeline when a simpler integration provides the required experience").
 * Server-only — never imported into client code (see the `server-only` guard).
 */
async function getStoredToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("github_credentials")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.token ?? null;
}

/**
 * Octokit instance for the current operator's token, or `null` when nothing
 * is configured — every caller (queries, actions, sync) treats "GitHub isn't
 * set up" as an ordinary, recoverable state instead of a crash at import time.
 */
export async function getGithubClient(): Promise<Octokit | null> {
  const token = resolveGithubToken(await getStoredToken(), process.env.GITHUB_TOKEN);
  if (!token) return null;
  return new Octokit({ auth: token });
}

/** Whether a GitHub token is configured at all — used for the Config screen's status readout. */
export async function isGithubConfigured(): Promise<boolean> {
  return resolveGithubTokenSource(await getStoredToken(), process.env.GITHUB_TOKEN) !== "none";
}

/** Where the active token came from, for the Config screen's copy. */
export async function getGithubTokenSource(): Promise<GithubTokenSource> {
  return resolveGithubTokenSource(await getStoredToken(), process.env.GITHUB_TOKEN);
}
