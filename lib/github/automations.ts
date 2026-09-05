/**
 * Automation-rule decisions for a repository sync. Pure and dependency-free:
 * given already-fetched (and already-shaped, see `lib/github/shape.ts`)
 * GitHub data, the caller's automation settings, a lookup of known tasks by
 * ref, and just enough existing-row context to detect "first ever commit" on
 * a branch, this decides exactly what should change. `lib/github/sync.ts` is
 * the only thing that turns this into I/O (DB upserts, calling the reused
 * `toggleTaskStatus`/`markProduction` Server Actions).
 *
 * Rule semantics mirror PLAN.md "GitHub Scope" and the task brief exactly:
 *  - commit_linking / branch_binding are "is linking on" toggles: when off,
 *    the regex match is simply skipped (not "unlink everything already
 *    linked") — see `resolveTaskEntry` calls below, gated by passing `null`
 *    text instead of the real text when a toggle is off.
 *  - PR linking (title + body) is gated by `commitLinking`, since a PR's
 *    title/body is message-shaped text like a commit message, whereas
 *    `branchBinding` only governs the branch *name* pattern.
 *  - first_commit_activates_task only fires for a `todo` task, and only when
 *    the branch had zero commits recorded before this sync but has at least
 *    one in this fetch — see `existingBranchCommitCounts`.
 *  - pr_merge_closes_task only fires for a task that isn't already `done`
 *    (so re-syncing an already-closed task never reopens it via the reused,
 *    toggling `toggleTaskStatus` action).
 *  - stale_branch_alert: a branch is stale when its last known commit is 14+
 *    days old. A branch with no known commit date is treated as *not* stale
 *    rather than guessing at a branch-creation date the schema doesn't store
 *    (`gh_branches` has no `created_at`) — a deliberate simplification, see
 *    the GitHub slice HANDOFF.
 *  - tag_marks_production: a `v*` semver-ish tag must point at the exact
 *    current tip of the default branch (not just "somewhere in its
 *    history") — the simplest correct reading of "a tag exists on the
 *    default branch" without needing a full ancestry walk per tag.
 */

import { resolveTaskEntry } from "@/lib/github/linking";
import type { TaskRefMap } from "@/lib/github/linking";
import type { ChecksState, PullRequestState } from "@/lib/types";

export interface SyncSettings {
  commitLinking: boolean;
  branchBinding: boolean;
  firstCommitActivatesTask: boolean;
  prMergeClosesTask: boolean;
  tagMarksProduction: boolean;
  staleBranchAlert: boolean;
}

export interface FetchedCommit {
  sha: string;
  message: string;
  branch: string | null;
  authoredAt: string;
}

export interface FetchedBranch {
  name: string;
  aheadBy: number;
  behindBy: number;
  lastCommitAt: string | null;
}

export interface FetchedPullRequest {
  number: number;
  title: string;
  body: string | null;
  branch: string | null;
  state: PullRequestState;
  checksState: ChecksState | null;
  additions: number;
  deletions: number;
  reviewerCount: number;
  githubUpdatedAt: string | null;
}

export interface PlannedCommit extends FetchedCommit {
  taskId: string | null;
}

export interface PlannedBranch extends FetchedBranch {
  taskId: string | null;
  isStale: boolean;
}

export interface PlannedPullRequest extends FetchedPullRequest {
  taskId: string | null;
}

export interface TaskActivation {
  taskId: string;
}

export interface TaskCompletion {
  taskId: string;
}

export interface SyncPlan {
  commits: PlannedCommit[];
  branches: PlannedBranch[];
  pullRequests: PlannedPullRequest[];
  taskActivations: TaskActivation[];
  taskCompletions: TaskCompletion[];
  shouldMarkProduction: boolean;
}

export interface BuildSyncPlanInput {
  settings: SyncSettings;
  tasksByRef: TaskRefMap;
  commits: FetchedCommit[];
  branches: FetchedBranch[];
  pullRequests: FetchedPullRequest[];
  /** Branch name -> number of commits already recorded for it before this sync. */
  existingBranchCommitCounts: Record<string, number>;
  tags: Array<{ name: string; sha: string }>;
  defaultBranchHeadSha: string;
  now: Date;
}

const STALE_DAYS = 14;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

const SEMVER_TAG_PATTERN = /^v\d+(\.\d+){0,2}(-[0-9A-Za-z.-]+)?$/i;

/** Whether a tag name looks like a release tag, e.g. "v1.0.0", "v2", "V1.2". */
export function isSemverTag(tagName: string): boolean {
  return SEMVER_TAG_PATTERN.test(tagName);
}

function isBranchStale(branch: FetchedBranch, now: Date): boolean {
  if (!branch.lastCommitAt) return false;
  const age = now.getTime() - new Date(branch.lastCommitAt).getTime();
  return age >= STALE_MS;
}

export function buildSyncPlan(input: BuildSyncPlanInput): SyncPlan {
  const { settings, tasksByRef } = input;

  // ---- Commits: link by message only, gated by commit_linking. ----------
  const commits: PlannedCommit[] = input.commits.map((c) => {
    const entry = resolveTaskEntry(settings.commitLinking ? c.message : null, tasksByRef);
    return { ...c, taskId: entry?.id ?? null };
  });

  // ---- Branches: link by name, gated by branch_binding; decide staleness
  // and first-commit activation alongside, since both need the same
  // per-branch task entry. --------------------------------------------------
  const taskActivations: TaskActivation[] = [];
  const activatedTaskIds = new Set<string>();

  const branches: PlannedBranch[] = input.branches.map((b) => {
    const entry = resolveTaskEntry(settings.branchBinding ? b.name : null, tasksByRef);
    const taskId = entry?.id ?? null;
    const isStale = settings.staleBranchAlert ? isBranchStale(b, input.now) : false;

    const hadNoCommitsBefore = (input.existingBranchCommitCounts[b.name] ?? 0) === 0;
    const hasNewCommitThisSync = input.commits.some((c) => c.branch === b.name);
    const isFirstCommitEver = hadNoCommitsBefore && hasNewCommitThisSync;

    if (
      settings.firstCommitActivatesTask &&
      taskId &&
      entry?.status === "todo" &&
      isFirstCommitEver &&
      !activatedTaskIds.has(taskId)
    ) {
      activatedTaskIds.add(taskId);
      taskActivations.push({ taskId });
    }

    return { ...b, taskId, isStale };
  });

  // ---- Pull requests: link by title, then body, gated by commit_linking;
  // a merge closes its linked (not-already-done) task. --------------------
  const taskCompletions: TaskCompletion[] = [];
  const completedTaskIds = new Set<string>();

  const pullRequests: PlannedPullRequest[] = input.pullRequests.map((pr) => {
    const entry = settings.commitLinking
      ? (resolveTaskEntry(pr.title, tasksByRef) ?? resolveTaskEntry(pr.body, tasksByRef))
      : null;
    const taskId = entry?.id ?? null;

    if (
      settings.prMergeClosesTask &&
      pr.state === "merged" &&
      entry &&
      entry.status !== "done" &&
      !completedTaskIds.has(entry.id)
    ) {
      completedTaskIds.add(entry.id);
      taskCompletions.push({ taskId: entry.id });
    }

    return { ...pr, taskId };
  });

  // ---- Tag marks production: a semver tag must sit at the default
  // branch's current head. --------------------------------------------------
  const shouldMarkProduction =
    settings.tagMarksProduction &&
    input.tags.some((t) => t.sha === input.defaultBranchHeadSha && isSemverTag(t.name));

  return { commits, branches, pullRequests, taskActivations, taskCompletions, shouldMarkProduction };
}
