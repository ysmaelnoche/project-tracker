import "server-only";

/**
 * Read-only GitHub-cache data access — the anon-key server client is enough
 * everywhere here since RLS already scopes every row to `auth.uid()` (same
 * pattern as `lib/projects/queries.ts`/`lib/tasks/queries.ts`). All view/sort
 * logic on top of these reads lives in `lib/github/views.ts`, not here.
 */

import { createClient } from "@/lib/supabase/server";
import { getGithubTokenSource, isGithubConfigured as checkGithubConfigured } from "@/lib/github/client";
import { ACTIVITY_TREND_WEEKS, buildActivityTrend, type ActivityTrend } from "@/lib/github/dev-activity";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  type AutomationSettings,
  type GhBranch,
  type GhCommit,
  type GhPullRequest,
  type Repository,
} from "@/lib/types";

export { checkGithubConfigured as isGithubConfigured, getGithubTokenSource };

interface RepositoryRow {
  id: string;
  project_id: string;
  owner: string;
  name: string;
  default_branch: string;
  visibility: Repository["visibility"];
  last_synced_at: string | null;
  last_push_at: string | null;
  last_sync_error: string | null;
}

interface BranchRow {
  id: string;
  repository_id: string;
  task_id: string | null;
  name: string;
  ahead_by: number;
  behind_by: number;
  last_commit_at: string | null;
  is_stale: boolean;
}

interface PullRequestRow {
  id: string;
  repository_id: string;
  task_id: string | null;
  number: number;
  title: string;
  branch: string | null;
  state: GhPullRequest["state"];
  checks_state: GhPullRequest["checksState"];
  additions: number;
  deletions: number;
  reviewer_count: number;
  github_updated_at: string | null;
  merged_at: string | null;
}

interface CommitRow {
  id: string;
  repository_id: string;
  task_id: string | null;
  sha: string;
  message: string;
  branch: string | null;
  authored_at: string;
}

function mapRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    projectId: row.project_id,
    owner: row.owner,
    name: row.name,
    defaultBranch: row.default_branch,
    visibility: row.visibility,
    lastSyncedAt: row.last_synced_at,
    lastPushAt: row.last_push_at,
    lastSyncError: row.last_sync_error,
  };
}

function mapBranch(row: BranchRow): GhBranch {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    taskId: row.task_id,
    name: row.name,
    aheadBy: row.ahead_by,
    behindBy: row.behind_by,
    lastCommitAt: row.last_commit_at,
    isStale: row.is_stale,
  };
}

function mapPullRequest(row: PullRequestRow): GhPullRequest {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    taskId: row.task_id,
    number: row.number,
    title: row.title,
    branch: row.branch,
    state: row.state,
    checksState: row.checks_state,
    additions: row.additions,
    deletions: row.deletions,
    reviewerCount: row.reviewer_count,
    githubUpdatedAt: row.github_updated_at,
    mergedAt: row.merged_at,
  };
}

function mapCommit(row: CommitRow): GhCommit {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    taskId: row.task_id,
    sha: row.sha,
    message: row.message,
    branch: row.branch,
    authoredAt: row.authored_at,
  };
}

/** id -> ref for every task, so GitHub rows can display "TSK-0102" instead of a raw uuid. */
async function getTaskRefsById(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("id, ref");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((t) => [t.id as string, t.ref as string]));
}

/** The single connected repository for a project, or null if none. */
export async function getRepositoryForProject(projectId: string): Promise<Repository | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRepository(data as RepositoryRow) : null;
}

export interface ProjectActivityTrend {
  hasRepo: boolean;
  trend: ActivityTrend;
}

function emptyProjectActivityTrend(): ProjectActivityTrend {
  return {
    hasRepo: false,
    trend: { commits: new Array(ACTIVITY_TREND_WEEKS).fill(0), merges: new Array(ACTIVITY_TREND_WEEKS).fill(0) },
  };
}

/**
 * The commit/merge trend for one project's connected repository — the
 * chart that replaced the task-progress bar on Project Detail (PLAN.md
 * addendum: the operator found a near-empty progress bar for a project
 * with no tasks yet more useful as real GitHub activity). `hasRepo: false`
 * (no repo connected at all) is distinct from a connected repo with zero
 * activity in the window — the caller renders nothing for the former,
 * a real all-zero chart for the latter.
 */
export async function getProjectActivityTrend(projectId: string, todayIso: string): Promise<ProjectActivityTrend> {
  const supabase = await createClient();

  const { data: repo } = await supabase
    .from("repositories")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!repo) return emptyProjectActivityTrend();

  const windowDays = ACTIVITY_TREND_WEEKS * 7;
  const sinceIso = new Date(Date.parse(`${todayIso}T00:00:00Z`) - windowDays * 86_400_000).toISOString();

  const [commitsResult, mergedResult] = await Promise.all([
    supabase
      .from("gh_commits")
      .select("authored_at")
      .eq("repository_id", repo.id)
      .gte("authored_at", sinceIso),
    supabase
      .from("gh_pull_requests")
      .select("merged_at")
      .eq("repository_id", repo.id)
      .eq("state", "merged")
      .gte("merged_at", sinceIso),
  ]);

  const commitDates = (commitsResult.data ?? []).map((c) => (c.authored_at as string).slice(0, 10));
  const mergedDates = (mergedResult.data ?? [])
    .map((p) => (p.merged_at as string | null)?.slice(0, 10))
    .filter((d): d is string => !!d);

  return {
    hasRepo: true,
    trend: buildActivityTrend(commitDates, mergedDates, ACTIVITY_TREND_WEEKS, todayIso),
  };
}

export interface RepositoryActivity {
  branches: Array<GhBranch & { taskRef: string | null }>;
  pullRequests: Array<GhPullRequest & { taskRef: string | null }>;
  commits: Array<GhCommit & { taskRef: string | null }>;
}

/** Branches/PRs/recent commits for one repository — feeds `RepoPanel`. */
export async function getRepositoryActivity(repositoryId: string): Promise<RepositoryActivity> {
  const supabase = await createClient();

  const [branchesResult, prsResult, commitsResult, taskRefsById] = await Promise.all([
    supabase.from("gh_branches").select("*").eq("repository_id", repositoryId),
    supabase
      .from("gh_pull_requests")
      .select("*")
      .eq("repository_id", repositoryId)
      .order("github_updated_at", { ascending: false }),
    supabase
      .from("gh_commits")
      .select("*")
      .eq("repository_id", repositoryId)
      .order("authored_at", { ascending: false })
      .limit(8),
    getTaskRefsById(),
  ]);

  if (branchesResult.error) throw new Error(branchesResult.error.message);
  if (prsResult.error) throw new Error(prsResult.error.message);
  if (commitsResult.error) throw new Error(commitsResult.error.message);

  const taskRef = (taskId: string | null) => (taskId ? (taskRefsById.get(taskId) ?? null) : null);

  return {
    branches: (branchesResult.data as BranchRow[]).map((row) => ({
      ...mapBranch(row),
      taskRef: taskRef(row.task_id),
    })),
    pullRequests: (prsResult.data as PullRequestRow[]).map((row) => ({
      ...mapPullRequest(row),
      taskRef: taskRef(row.task_id),
    })),
    commits: (commitsResult.data as CommitRow[]).map((row) => ({
      ...mapCommit(row),
      taskRef: taskRef(row.task_id),
    })),
  };
}

export interface SourceRepository extends Repository {
  projectRef: string;
  projectName: string;
  branchCount: number;
  openPrCount: number;
}

export interface SourceOverview {
  repositories: SourceRepository[];
  branches: Array<GhBranch & { projectRef: string; taskRef: string | null }>;
  pullRequests: Array<GhPullRequest & { projectRef: string; taskRef: string | null }>;
  commits: Array<GhCommit & { projectRef: string; taskRef: string | null }>;
  unlinkedProjects: Array<{ id: string; ref: string; name: string }>;
  liveProjectCount: number;
}

/**
 * Everything the cross-project Source Control screen needs, in one read.
 * Scoped GitHub tables are fetched with a plain `.in("repository_id", …)`
 * filter rather than a nested PostgREST embed — simpler to reason about and
 * to keep in sync with `Repository`'s 1:1-with-project shape.
 */
export async function getSourceOverview(): Promise<SourceOverview> {
  const supabase = await createClient();

  const [projectsResult, reposResult, taskRefsById] = await Promise.all([
    supabase.from("projects").select("id, ref, name, status").order("created_at", { ascending: true }),
    supabase.from("repositories").select("*"),
    getTaskRefsById(),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (reposResult.error) throw new Error(reposResult.error.message);

  const projects = projectsResult.data as Array<{ id: string; ref: string; name: string; status: string }>;
  const repoRows = reposResult.data as RepositoryRow[];
  const repositoryIds = repoRows.map((r) => r.id);

  const [branchesResult, prsResult, commitsResult] = repositoryIds.length
    ? await Promise.all([
        supabase.from("gh_branches").select("*").in("repository_id", repositoryIds),
        supabase.from("gh_pull_requests").select("*").in("repository_id", repositoryIds),
        supabase
          .from("gh_commits")
          .select("*")
          .in("repository_id", repositoryIds)
          .order("authored_at", { ascending: false })
          .limit(50),
      ])
    : [
        { data: [] as BranchRow[], error: null },
        { data: [] as PullRequestRow[], error: null },
        { data: [] as CommitRow[], error: null },
      ];

  if (branchesResult.error) throw new Error(branchesResult.error.message);
  if (prsResult.error) throw new Error(prsResult.error.message);
  if (commitsResult.error) throw new Error(commitsResult.error.message);

  const branchRows = (branchesResult.data ?? []) as BranchRow[];
  const prRows = (prsResult.data ?? []) as PullRequestRow[];
  const commitRows = (commitsResult.data ?? []) as CommitRow[];

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const projectRefByRepoId = new Map(repoRows.map((r) => [r.id, projectById.get(r.project_id)?.ref ?? "—"]));
  const branchCountByRepo = new Map<string, number>();
  const openPrCountByRepo = new Map<string, number>();
  for (const b of branchRows) {
    branchCountByRepo.set(b.repository_id, (branchCountByRepo.get(b.repository_id) ?? 0) + 1);
  }
  for (const p of prRows) {
    if (p.state !== "merged" && p.state !== "closed") {
      openPrCountByRepo.set(p.repository_id, (openPrCountByRepo.get(p.repository_id) ?? 0) + 1);
    }
  }

  const connectedProjectIds = new Set(repoRows.map((r) => r.project_id));
  const liveProjects = projects.filter((p) => p.status !== "archived");
  const taskRef = (taskId: string | null) => (taskId ? (taskRefsById.get(taskId) ?? null) : null);

  return {
    repositories: repoRows.map((row) => {
      const project = projectById.get(row.project_id);
      return {
        ...mapRepository(row),
        projectRef: project?.ref ?? "—",
        projectName: project?.name ?? "—",
        branchCount: branchCountByRepo.get(row.id) ?? 0,
        openPrCount: openPrCountByRepo.get(row.id) ?? 0,
      };
    }),
    branches: branchRows.map((row) => ({
      ...mapBranch(row),
      projectRef: projectRefByRepoId.get(row.repository_id) ?? "—",
      taskRef: taskRef(row.task_id),
    })),
    pullRequests: prRows.map((row) => ({
      ...mapPullRequest(row),
      projectRef: projectRefByRepoId.get(row.repository_id) ?? "—",
      taskRef: taskRef(row.task_id),
    })),
    commits: commitRows.map((row) => ({
      ...mapCommit(row),
      projectRef: projectRefByRepoId.get(row.repository_id) ?? "—",
      taskRef: taskRef(row.task_id),
    })),
    unlinkedProjects: liveProjects
      .filter((p) => !connectedProjectIds.has(p.id))
      .map((p) => ({ id: p.id, ref: p.ref, name: p.name })),
    liveProjectCount: liveProjects.length,
  };
}

/**
 * Automation-rule settings, defaulting to `DEFAULT_AUTOMATION_SETTINGS` when
 * signed out, on a query error, or before the user's `automation_settings`
 * row has ever been written — same defensive-default pattern as
 * `lib/projects/queries.ts`'s `getConfirmBeforeArchive`.
 */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_AUTOMATION_SETTINGS;

  const { data, error } = await supabase
    .from("automation_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_AUTOMATION_SETTINGS;

  return {
    commitLinking: data.commit_linking,
    branchBinding: data.branch_binding,
    firstCommitActivatesTask: data.first_commit_activates_task,
    prMergeClosesTask: data.pr_merge_closes_task,
    tagMarksProduction: data.tag_marks_production,
    staleBranchAlert: data.stale_branch_alert,
    confirmBeforeArchive: data.confirm_before_archive,
  };
}
