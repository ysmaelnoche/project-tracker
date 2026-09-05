/**
 * Pure aggregation logic for the Dashboard's Development Activity panel —
 * real commits/PRs across the operator's *connected* repos (private repos
 * included), unlike the account-wide contribution calendar this replaces
 * (GitHub's public API can't see private activity at all — see git history
 * for that dead end). No "server-only" here so it stays unit-testable
 * without a database; see dev-activity-fetch.ts for the actual reads.
 */

/** The trend window every commit/merge trend chart in the app shares — the Dashboard's aggregate panel and each project's own trend. */
export const ACTIVITY_TREND_WEEKS = 12;

function diffDays(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000);
}

/**
 * Buckets dates into `weeks` consecutive 7-day windows ending today, oldest
 * first (so the array renders left-to-right in chronological order). Dates
 * older than the whole window, or dated in the future, are dropped rather
 * than skewing an edge bucket. Shared by every per-week activity series —
 * commits, merges, or anything else dated by day.
 */
function bucketDatesByWeek(dates: string[], weeks: number, todayIso: string): number[] {
  const buckets = new Array(weeks).fill(0) as number[];

  for (const dateIso of dates) {
    const daysAgo = diffDays(dateIso, todayIso);
    if (daysAgo < 0) continue;

    const weekIndexFromEnd = Math.floor(daysAgo / 7);
    const bucketIndex = weeks - 1 - weekIndexFromEnd;
    if (bucketIndex >= 0 && bucketIndex < weeks) {
      buckets[bucketIndex] = (buckets[bucketIndex] ?? 0) + 1;
    }
  }

  return buckets;
}

/** Buckets commit dates into `weeks` consecutive 7-day windows ending today. */
export function bucketCommitsByWeek(commitDates: string[], weeks: number, todayIso: string): number[] {
  return bucketDatesByWeek(commitDates, weeks, todayIso);
}

export interface ActivityTrend {
  commits: number[];
  merges: number[];
}

/**
 * The two-line commit/merge trend (DevelopmentActivityPanel, and the
 * per-project trend replacing the task-progress bar on Project Detail):
 * commit dates and PR-merge dates bucketed into the same `weeks` window,
 * as independent parallel series — a week can have commits with no merges,
 * or vice versa.
 */
export function buildActivityTrend(
  commitDates: string[],
  mergedDates: string[],
  weeks: number,
  todayIso: string,
): ActivityTrend {
  return {
    commits: bucketDatesByWeek(commitDates, weeks, todayIso),
    merges: bucketDatesByWeek(mergedDates, weeks, todayIso),
  };
}

export interface CommitForActivity {
  repositoryId: string;
}

export interface PullRequestForActivity {
  repositoryId: string;
  state: string;
}

export interface RepoLabel {
  repositoryId: string;
  projectRef: string;
  projectName: string;
}

export interface RepoActivitySummary {
  projectRef: string;
  projectName: string;
  commitCount: number;
  openPrCount: number;
}

/** Per-repo commit/open-PR counts, busiest repo first — the breakdown list
 * under the bar chart. */
export function summarizeActivityByRepo(
  commits: CommitForActivity[],
  pullRequests: PullRequestForActivity[],
  repoLabels: RepoLabel[],
): RepoActivitySummary[] {
  const labelByRepoId = new Map(repoLabels.map((r) => [r.repositoryId, r]));

  const commitCounts = new Map<string, number>();
  for (const c of commits) {
    commitCounts.set(c.repositoryId, (commitCounts.get(c.repositoryId) ?? 0) + 1);
  }

  const openPrCounts = new Map<string, number>();
  for (const p of pullRequests) {
    if (p.state === "merged" || p.state === "closed") continue;
    openPrCounts.set(p.repositoryId, (openPrCounts.get(p.repositoryId) ?? 0) + 1);
  }

  const repoIds = new Set([...commitCounts.keys(), ...openPrCounts.keys()]);

  return Array.from(repoIds)
    .map((id) => {
      const label = labelByRepoId.get(id);
      return {
        projectRef: label?.projectRef ?? "—",
        projectName: label?.projectName ?? "Unknown",
        commitCount: commitCounts.get(id) ?? 0,
        openPrCount: openPrCounts.get(id) ?? 0,
      };
    })
    .sort((a, b) => b.commitCount - a.commitCount);
}
