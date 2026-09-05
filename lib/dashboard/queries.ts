/**
 * Small, self-contained, READ-ONLY reads for the Dashboard. There's no shared
 * "dashboard query service" to depend on — this reads `projects`, `tasks`,
 * `activity_log`, and (read-only) `repositories`/`gh_pull_requests`/
 * `gh_commits` directly, the same way `lib/projects/task-reads.ts` reads
 * straight from `tasks` for the Projects slice's own cross-domain needs. The
 * GitHub tables will simply come back empty until that slice lands — the
 * Overview lights up automatically once it does, no dashboard changes needed.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  ActivityTone,
  ChecksState,
  GhCommit,
  Priority,
  Project,
  ProjectStatus,
  ProjectType,
  PullRequestState,
  GhPullRequest,
  Repository,
  RepoVisibility,
  Task,
  TaskStatus,
} from "@/lib/types";

interface ProjectRow {
  id: string;
  ref: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  dev_start_date: string | null;
  target_date: string | null;
  published_date: string | null;
  archived_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    description: row.description,
    type: row.type,
    status: row.status,
    priority: row.priority,
    devStartDate: row.dev_start_date,
    targetDate: row.target_date,
    publishedDate: row.published_date,
    archivedAt: row.archived_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links: [],
  };
}

interface TaskRow {
  id: string;
  ref: string;
  project_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    ref: row.ref,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    dueTime: row.due_time,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ActivityRow {
  id: string;
  verb: string;
  subject: string;
  context_ref: string | null;
  tone: ActivityTone;
  created_at: string;
}

function mapActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    verb: row.verb,
    subject: row.subject,
    contextRef: row.context_ref,
    tone: row.tone,
    createdAt: row.created_at,
  };
}

interface RepositoryRow {
  id: string;
  project_id: string;
  owner: string;
  name: string;
  default_branch: string;
  visibility: RepoVisibility | null;
  last_synced_at: string | null;
  last_push_at: string | null;
  last_sync_error: string | null;
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

interface PullRequestRow {
  id: string;
  repository_id: string;
  task_id: string | null;
  number: number;
  title: string;
  branch: string | null;
  state: PullRequestState;
  checks_state: ChecksState | null;
  additions: number;
  deletions: number;
  reviewer_count: number;
  github_updated_at: string | null;
  merged_at: string | null;
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

interface CommitRow {
  id: string;
  repository_id: string;
  task_id: string | null;
  sha: string;
  message: string;
  branch: string | null;
  authored_at: string;
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

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  activity: ActivityEvent[];
  repositories: Repository[];
  pullRequests: GhPullRequest[];
  commits: GhCommit[];
}

/**
 * Every row the Overview needs, in one batch of parallel reads (RLS already
 * scopes each table to `auth.uid()`). `gh_*`/`repositories` come back empty
 * until the GitHub slice starts writing to them — that's the correct empty
 * state, not an error.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [projectsResult, tasksResult, activityResult, repositoriesResult, pullRequestsResult, commitsResult] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, ref, name, description, type, status, priority, dev_start_date, target_date, published_date, archived_at, notes, created_at, updated_at",
        ),
      supabase
        .from("tasks")
        .select(
          "id, ref, project_id, title, description, status, priority, due_date, due_time, completed_at, created_at, updated_at",
        ),
      supabase
        .from("activity_log")
        .select("id, verb, subject, context_ref, tone, created_at")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("repositories").select("id, project_id, owner, name, default_branch, visibility, last_synced_at, last_push_at, last_sync_error"),
      supabase
        .from("gh_pull_requests")
        .select(
          "id, repository_id, task_id, number, title, branch, state, checks_state, additions, deletions, reviewer_count, github_updated_at, merged_at",
        ),
      supabase.from("gh_commits").select("id, repository_id, task_id, sha, message, branch, authored_at"),
    ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (activityResult.error) throw new Error(activityResult.error.message);
  if (repositoriesResult.error) throw new Error(repositoriesResult.error.message);
  if (pullRequestsResult.error) throw new Error(pullRequestsResult.error.message);
  if (commitsResult.error) throw new Error(commitsResult.error.message);

  return {
    projects: ((projectsResult.data ?? []) as ProjectRow[]).map(mapProject),
    tasks: ((tasksResult.data ?? []) as TaskRow[]).map(mapTask),
    activity: ((activityResult.data ?? []) as ActivityRow[]).map(mapActivity),
    repositories: ((repositoriesResult.data ?? []) as RepositoryRow[]).map(mapRepository),
    pullRequests: ((pullRequestsResult.data ?? []) as PullRequestRow[]).map(mapPullRequest),
    commits: ((commitsResult.data ?? []) as CommitRow[]).map(mapCommit),
  };
}

/**
 * The handful of counts `<ScopeBar statusLine>` needs on every `(app)` page
 * (not just the Dashboard) — deliberately a narrower, cheaper read than
 * `getDashboardData()` since the layout runs this on every navigation.
 */
export async function getStatusLineCounts(): Promise<{
  projects: { status: ProjectStatus }[];
  tasks: { status: TaskStatus; dueDate: string | null }[];
}> {
  const supabase = await createClient();

  const [projectsResult, tasksResult] = await Promise.all([
    supabase.from("projects").select("status"),
    supabase.from("tasks").select("status, due_date"),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);

  return {
    projects: (projectsResult.data ?? []) as { status: ProjectStatus }[],
    tasks: ((tasksResult.data ?? []) as { status: TaskStatus; due_date: string | null }[]).map((row) => ({
      status: row.status,
      dueDate: row.due_date,
    })),
  };
}
