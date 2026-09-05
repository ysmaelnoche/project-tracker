/**
 * Pure view-shaping for the cross-project Source Control screen
 * (`app/(app)/source/page.tsx`) — no I/O, mirrors the Tasks slice's
 * `lib/tasks/views.ts` split between reads (`lib/github/queries.ts`) and
 * derived presentation logic (here).
 */

import type { PullRequestState } from "@/lib/types";

/** "In flight" for the metrics strip and the PR feed's default ordering. */
export function isPullRequestOpen(state: PullRequestState): boolean {
  return state === "draft" || state === "open" || state === "review";
}

export interface SourceMetrics {
  linkedRepos: number;
  totalProjects: number;
  openPRs: number;
  awaitingReview: number;
  failingChecks: number;
  pushedToday: number;
  staleBranches: number;
}

export function computeSourceMetrics(input: {
  repoCount: number;
  liveProjectCount: number;
  pullRequests: Array<{ state: PullRequestState; checksState: string | null }>;
  commits: Array<{ authoredAt: string }>;
  branches: Array<{ isStale: boolean }>;
  today: string; // "YYYY-MM-DD"
}): SourceMetrics {
  return {
    linkedRepos: input.repoCount,
    totalProjects: input.liveProjectCount,
    openPRs: input.pullRequests.filter((p) => isPullRequestOpen(p.state)).length,
    awaitingReview: input.pullRequests.filter((p) => p.state === "review").length,
    failingChecks: input.pullRequests.filter((p) => p.checksState === "fail" && isPullRequestOpen(p.state)).length,
    pushedToday: input.commits.filter((c) => c.authoredAt.startsWith(input.today)).length,
    staleBranches: input.branches.filter((b) => b.isStale).length,
  };
}

export type SourceTab = "prs" | "branches" | "commits";

export const SOURCE_TAB_DEFS: { key: SourceTab; label: string }[] = [
  { key: "prs", label: "PULL REQUESTS" },
  { key: "branches", label: "BRANCHES" },
  { key: "commits", label: "COMMIT FEED" },
];

/** Defensive parse of the `?tab=` search param — falls back to "prs". */
export function parseSourceTab(value: string | undefined | null): SourceTab {
  return SOURCE_TAB_DEFS.some((t) => t.key === value) ? (value as SourceTab) : "prs";
}

/** Builds a `/source` href for a tab, omitting the param when it's the default. */
export function buildSourceTabHref(tab: SourceTab): string {
  return tab === "prs" ? "/source" : `/source?tab=${tab}`;
}

/** Every open/review/draft PR first (newest-updated order preserved), then merged/closed. */
export function sortPullRequestsForFeed<T extends { state: PullRequestState }>(prs: T[]): T[] {
  return prs
    .map((pr, i) => ({ pr, i }))
    .sort((a, b) => {
      const aOpen = isPullRequestOpen(a.pr.state);
      const bOpen = isPullRequestOpen(b.pr.state);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return a.i - b.i;
    })
    .map(({ pr }) => pr);
}
