import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVITY_TREND_WEEKS,
  buildActivityTrend,
  summarizeActivityByRepo,
  type ActivityTrend,
  type RepoActivitySummary,
} from "@/lib/github/dev-activity";

export interface DevelopmentActivity {
  totalCommits: number;
  totalMerges: number;
  trend: ActivityTrend;
  repoBreakdown: RepoActivitySummary[];
  hasAnyRepo: boolean;
}

const WINDOW_DAYS = ACTIVITY_TREND_WEEKS * 7;

function emptyActivity(): DevelopmentActivity {
  return {
    totalCommits: 0,
    totalMerges: 0,
    trend: { commits: new Array(ACTIVITY_TREND_WEEKS).fill(0), merges: new Array(ACTIVITY_TREND_WEEKS).fill(0) },
    repoBreakdown: [],
    hasAnyRepo: false,
  };
}

/**
 * Real commit/PR activity across every repo connected to a project here
 * (private repos included — this is a plain per-repo read, not the
 * account-wide GitHub API that can't see private activity). Empty/zeroed
 * out gracefully when nothing is connected yet or the query fails, same
 * "never break the Dashboard" rule as everywhere else in lib/github/.
 */
export async function getDevelopmentActivity(todayIso: string): Promise<DevelopmentActivity> {
  const supabase = await createClient();

  const { data: repos } = await supabase
    .from("repositories")
    .select("id, project_id");
  const repositories = repos ?? [];

  if (repositories.length === 0) {
    return emptyActivity();
  }

  const repositoryIds = repositories.map((r) => r.id);
  const sinceIso = new Date(Date.parse(`${todayIso}T00:00:00Z`) - WINDOW_DAYS * 86_400_000).toISOString();

  const [commitsResult, mergedInWindowResult, allPrsResult, projectsResult] = await Promise.all([
    supabase
      .from("gh_commits")
      .select("repository_id, authored_at")
      .in("repository_id", repositoryIds)
      .gte("authored_at", sinceIso),
    supabase
      .from("gh_pull_requests")
      .select("repository_id, merged_at")
      .in("repository_id", repositoryIds)
      .eq("state", "merged")
      .gte("merged_at", sinceIso),
    supabase.from("gh_pull_requests").select("repository_id, state").in("repository_id", repositoryIds),
    supabase.from("projects").select("id, ref, name"),
  ]);

  const commits = commitsResult.data ?? [];
  const mergedInWindow = mergedInWindowResult.data ?? [];
  const allPullRequests = allPrsResult.data ?? [];
  const projectById = new Map((projectsResult.data ?? []).map((p) => [p.id, p]));

  const repoLabels = repositories.map((r) => {
    const project = projectById.get(r.project_id);
    return {
      repositoryId: r.id,
      projectRef: project?.ref ?? "—",
      projectName: project?.name ?? "Unknown",
    };
  });

  const commitDates = commits.map((c) => (c.authored_at as string).slice(0, 10));
  const mergedDates = mergedInWindow
    .map((p) => (p.merged_at as string | null)?.slice(0, 10))
    .filter((d): d is string => !!d);

  return {
    totalCommits: commits.length,
    totalMerges: mergedInWindow.length,
    trend: buildActivityTrend(commitDates, mergedDates, ACTIVITY_TREND_WEEKS, todayIso),
    repoBreakdown: summarizeActivityByRepo(
      commits.map((c) => ({ repositoryId: c.repository_id as string })),
      allPullRequests.map((p) => ({ repositoryId: p.repository_id as string, state: p.state as string })),
      repoLabels,
    ),
    hasAnyRepo: true,
  };
}
