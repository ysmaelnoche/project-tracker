import "server-only";
import { Octokit } from "@octokit/rest";

/**
 * Octokit instance backed by `GITHUB_TOKEN` — a personal access token, per
 * the architecture decision in PLAN.md ("do not build a complicated event
 * pipeline when a simpler integration provides the required experience"):
 * no GitHub App, no webhooks, no public endpoint. Server-only — never
 * imported into client code (see the `server-only` guard above).
 *
 * Returns `null` when the token isn't configured rather than throwing, so
 * every caller (queries, actions, sync) can treat "GitHub isn't set up" as
 * an ordinary, recoverable state instead of a crash at import time.
 */
export function getGithubClient(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new Octokit({ auth: token });
}

/** Whether a GitHub token is configured at all — used for the Config screen's status readout. */
export function isGithubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN;
}
