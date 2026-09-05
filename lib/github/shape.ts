/**
 * Pure data-shaping for the GitHub sync pipeline, split into two directions:
 *
 *  1. Octokit's raw REST response shapes -> the plain `Fetched*` types
 *     `lib/github/automations.ts` decides against (`shapeCommit`,
 *     `shapeBranchFromCompare`, `shapePullRequest`, `deriveChecksState`).
 *     These only read the handful of fields we actually use, so they're
 *     testable with small hand-written fixtures — no live Octokit call or
 *     network access needed.
 *  2. A `PlannedCommit`/`PlannedBranch`/`PlannedPullRequest` (the output of
 *     `buildSyncPlan`) -> the exact row shape `lib/github/sync.ts` upserts
 *     into `gh_commits`/`gh_branches`/`gh_pull_requests` (`toCommitRow`,
 *     `toBranchRow`, `toPullRequestRow`).
 *
 * `lib/github/sync.ts` is the only caller that ever touches a real Octokit
 * instance or Supabase client — this file has no I/O at all.
 */

import type {
  PlannedBranch,
  PlannedCommit,
  PlannedPullRequest,
  FetchedBranch,
  FetchedCommit,
  FetchedPullRequest,
} from "@/lib/github/automations";
import type { ChecksState, PullRequestState } from "@/lib/types";

// ---------------------------------------------------------------------------
// Octokit raw response -> Fetched*
// ---------------------------------------------------------------------------

export interface OctokitCommitLike {
  sha: string;
  commit: {
    message: string;
    author?: { date?: string | null } | null;
    committer?: { date?: string | null } | null;
  };
}

/** First line only (matches the compact single-line commit summaries used everywhere in the UI). */
export function shapeCommit(raw: OctokitCommitLike, branch: string | null): FetchedCommit {
  return {
    sha: raw.sha,
    message: raw.commit.message.split("\n")[0] ?? "",
    branch,
    authoredAt: raw.commit.author?.date ?? raw.commit.committer?.date ?? new Date().toISOString(),
  };
}

export interface OctokitCompareLike {
  ahead_by: number;
  behind_by: number;
  commits: OctokitCommitLike[];
}

/**
 * Shapes one non-default branch from `GET /repos/{owner}/{repo}/compare/
 * {base}...{head}` — this single call gives us both the ahead/behind drift
 * and exactly the commits unique to that branch (not yet on the default
 * branch), so there's no need for a separate per-branch commit fetch.
 */
export function shapeBranchFromCompare(
  name: string,
  compare: OctokitCompareLike,
): { branch: FetchedBranch; commits: FetchedCommit[] } {
  const commits = compare.commits.map((c) => shapeCommit(c, name));
  const lastCommitAt = commits.length > 0 ? (commits[commits.length - 1]?.authoredAt ?? null) : null;
  return {
    branch: { name, aheadBy: compare.ahead_by, behindBy: compare.behind_by, lastCommitAt },
    commits,
  };
}

export interface OctokitCheckRunLike {
  status: string;
  conclusion: string | null;
}

const FAILING_CONCLUSIONS = new Set(["failure", "timed_out", "cancelled", "action_required"]);

/** Aggregates a ref's check runs into the single `checks_state` our schema stores. */
export function deriveChecksState(runs: OctokitCheckRunLike[]): ChecksState | null {
  if (runs.length === 0) return null;
  if (runs.some((r) => r.status !== "completed")) return "running";
  if (runs.some((r) => r.conclusion !== null && FAILING_CONCLUSIONS.has(r.conclusion))) return "fail";
  return "pass";
}

export interface OctokitPullRequestLike {
  number: number;
  title: string;
  body?: string | null;
  head: { ref: string };
  state: "open" | "closed";
  draft?: boolean | null;
  merged_at?: string | null;
  updated_at: string;
  additions?: number;
  deletions?: number;
  requested_reviewers?: unknown[] | null;
}

export interface PullRequestReviewSignal {
  /** Whether any review on this PR currently requests changes. */
  hasChangesRequested: boolean;
}

function derivePullRequestState(
  raw: Pick<OctokitPullRequestLike, "state" | "draft" | "merged_at">,
  review: PullRequestReviewSignal,
): PullRequestState {
  if (raw.merged_at) return "merged";
  if (raw.state === "closed") return "closed";
  if (raw.draft) return "draft";
  if (review.hasChangesRequested) return "review";
  return "open";
}

export function shapePullRequest(
  raw: OctokitPullRequestLike,
  review: PullRequestReviewSignal,
  checksState: ChecksState | null,
): FetchedPullRequest {
  return {
    number: raw.number,
    title: raw.title,
    body: raw.body ?? null,
    branch: raw.head.ref,
    state: derivePullRequestState(raw, review),
    checksState,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
    reviewerCount: raw.requested_reviewers?.length ?? 0,
    githubUpdatedAt: raw.updated_at,
    mergedAt: raw.merged_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Planned* (buildSyncPlan output) -> DB upsert row
// ---------------------------------------------------------------------------

export function toCommitRow(repositoryId: string, row: PlannedCommit) {
  return {
    repository_id: repositoryId,
    task_id: row.taskId,
    sha: row.sha,
    message: row.message,
    branch: row.branch,
    authored_at: row.authoredAt,
  };
}

export function toBranchRow(repositoryId: string, row: PlannedBranch) {
  return {
    repository_id: repositoryId,
    task_id: row.taskId,
    name: row.name,
    ahead_by: row.aheadBy,
    behind_by: row.behindBy,
    last_commit_at: row.lastCommitAt,
    is_stale: row.isStale,
  };
}

export function toPullRequestRow(repositoryId: string, row: PlannedPullRequest) {
  return {
    repository_id: repositoryId,
    task_id: row.taskId,
    number: row.number,
    title: row.title,
    branch: row.branch,
    state: row.state,
    checks_state: row.checksState,
    additions: row.additions,
    deletions: row.deletions,
    reviewer_count: row.reviewerCount,
    github_updated_at: row.githubUpdatedAt,
    merged_at: row.mergedAt,
  };
}
