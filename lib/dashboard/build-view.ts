/**
 * Composes one `DashboardView` (everything every Overview panel needs to
 * render) from already-fetched domain rows. Pure — no I/O — so the wiring
 * between per-project "next task" selection, the Primary Directive, metrics,
 * and every scoped list is unit-testable without a live database. The I/O
 * side lives in `lib/dashboard/queries.ts`, which is a thin fetch-and-map
 * wrapper around this.
 */

import { formatStamp, diffDays } from "@/lib/format";
import { pickNextTask } from "@/lib/next-task";
import { computeTaskProgress } from "@/lib/projects/progress";
import { decorateTaskRow, type TaskRowView } from "@/lib/tasks/present";
import { buildMetrics, type MetricTile } from "@/lib/dashboard/metrics";
import { pickPrimaryDirective, type PrimaryDirective } from "@/lib/dashboard/directive";
import {
  selectActiveProjects,
  selectDeployedProjects,
  selectStandbyProjects,
} from "@/lib/dashboard/projects-select";
import { selectReviewQueue } from "@/lib/dashboard/review-queue";
import { buildUpcoming, selectMyDayTasks, type UpcomingEntry } from "@/lib/dashboard/schedule";
import { taskMatchesScope, type DashboardScope } from "@/lib/dashboard/scope";
import type {
  ActivityEvent,
  ActivityTone,
  ChecksState,
  GhCommit,
  GhPullRequest,
  Project,
  ProjectType,
  PullRequestState,
  Repository,
  Task,
} from "@/lib/types";

export interface ActiveBuildCard {
  id: string;
  ref: string;
  name: string;
  type: ProjectType;
  description: string;
  percent: number;
  doneTasks: number;
  totalTasks: number;
  metaLine: string;
  nextTaskTitle: string | null;
  /** "N commits today · N open PRs" — null when the project has no connected repo. */
  githubSnippet: string | null;
}

export interface StandbyEntry {
  id: string;
  ref: string;
  name: string;
  type: ProjectType;
}

export interface DeployedEntry {
  id: string;
  ref: string;
  name: string;
  publishedLabel: string;
  durationLabel: string;
}

export interface ReviewQueueRow {
  id: string;
  projectId: string;
  projectRef: string;
  number: number;
  title: string;
  state: PullRequestState;
  checksState: ChecksState | null;
}

export interface EventLogRow {
  id: string;
  verb: string;
  subject: string;
  contextRef: string | null;
  tone: ActivityTone;
  createdAt: string;
}

export interface DashboardView {
  metrics: MetricTile[];
  directive: PrimaryDirective | null;
  activeBuilds: ActiveBuildCard[];
  myDay: TaskRowView[];
  upcoming: UpcomingEntry[];
  standby: StandbyEntry[];
  deployed: DeployedEntry[];
  reviewQueue: ReviewQueueRow[];
  eventLog: EventLogRow[];
}

export interface BuildDashboardViewInput {
  projects: Project[];
  tasks: Task[];
  activity: ActivityEvent[];
  repositories: Repository[];
  pullRequests: GhPullRequest[];
  commits: GhCommit[];
  scope: DashboardScope;
  today: string;
}

function isOpenPr(state: PullRequestState): boolean {
  return state !== "merged" && state !== "closed";
}

function isSameDay(iso: string, today: string): boolean {
  return iso.slice(0, 10) === today;
}

function buildCardMetaLine(project: Project, done: number, total: number): string {
  const bits: string[] = [
    total > 0 ? `${String(done).padStart(2, "0")}/${String(total).padStart(2, "0")} TASKS` : "NO TASKS",
  ];
  if (project.devStartDate) bits.push(`START ${formatStamp(project.devStartDate)}`);
  if (project.targetDate) bits.push(`TARGET ${formatStamp(project.targetDate)}`);
  return bits.join(" · ");
}

export function buildDashboardView(input: BuildDashboardViewInput): DashboardView {
  const { projects, tasks, activity, repositories, pullRequests, commits, scope, today } = input;

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const tasksByProject = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.projectId) continue;
    const list = tasksByProject.get(t.projectId);
    if (list) list.push(t);
    else tasksByProject.set(t.projectId, [t]);
  }
  const repoByProject = new Map(repositories.map((r) => [r.projectId, r]));

  // ---- Metrics bar (PLAN.md "Dashboard Overview") — global, never scoped ----
  const openPrCount = pullRequests.filter((p) => isOpenPr(p.state)).length;
  const metrics = buildMetrics(projects, tasks, openPrCount, today);

  // ---- Active Builds + Primary Directive ----
  const activeProjects = selectActiveProjects(projects, scope);
  const nextTaskByProject = new Map(
    activeProjects.map((p) => [p.id, pickNextTask(tasksByProject.get(p.id) ?? [])]),
  );

  const activeBuilds: ActiveBuildCard[] = activeProjects.map((p) => {
    const projectTasks = tasksByProject.get(p.id) ?? [];
    const { done, total, percent } = computeTaskProgress(projectTasks);
    const nextTask = nextTaskByProject.get(p.id) ?? null;
    const repo = repoByProject.get(p.id);

    let githubSnippet: string | null = null;
    if (repo) {
      const commitsToday = commits.filter(
        (c) => c.repositoryId === repo.id && isSameDay(c.authoredAt, today),
      ).length;
      const openPrs = pullRequests.filter(
        (pr) => pr.repositoryId === repo.id && isOpenPr(pr.state),
      ).length;
      githubSnippet = `${commitsToday} commit${commitsToday === 1 ? "" : "s"} today · ${openPrs} open PR${openPrs === 1 ? "" : "s"}`;
    }

    return {
      id: p.id,
      ref: p.ref,
      name: p.name,
      type: p.type,
      description: p.description,
      percent,
      doneTasks: done,
      totalTasks: total,
      metaLine: buildCardMetaLine(p, done, total),
      nextTaskTitle: nextTask?.title ?? null,
      githubSnippet,
    };
  });

  const directive = pickPrimaryDirective(
    activeProjects.map((p) => {
      const nextTask = nextTaskByProject.get(p.id) ?? null;
      return {
        id: p.id,
        ref: p.ref,
        name: p.name,
        nextTask: nextTask
          ? {
              id: nextTask.id,
              title: nextTask.title,
              status: nextTask.status,
              priority: nextTask.priority,
              dueDate: nextTask.dueDate,
            }
          : null,
      };
    }),
    today,
  );

  // ---- My Day / Upcoming (PLAN.md "My Day" / "Upcoming") ----
  const scopedTasks = tasks.filter((t) =>
    taskMatchesScope(scope, t.projectId ? (projectById.get(t.projectId)?.type ?? null) : null),
  );

  const myDay: TaskRowView[] = selectMyDayTasks(scopedTasks, today).map((t) =>
    decorateTaskRow(t, t.projectId ? (projectById.get(t.projectId) ?? null) : null, today),
  );

  const upcomingTaskInputs = scopedTasks.map((t) => ({
    status: t.status,
    dueDate: t.dueDate,
    title: t.title,
    contextLabel: t.projectId ? (projectById.get(t.projectId)?.ref ?? "STANDALONE") : "STANDALONE",
  }));
  const milestoneInputs = activeProjects
    .filter((p): p is Project & { targetDate: string } => !!p.targetDate)
    .map((p) => ({ title: p.name, targetDate: p.targetDate }));
  const upcoming = buildUpcoming(upcomingTaskInputs, milestoneInputs, today);

  // ---- Standby / Deployed (PLAN.md "Pending Projects" / "Production Projects") ----
  const standby: StandbyEntry[] = selectStandbyProjects(projects, scope).map((p) => ({
    id: p.id,
    ref: p.ref,
    name: p.name,
    type: p.type,
  }));

  const deployed: DeployedEntry[] = selectDeployedProjects(projects, scope, 3).map((p) => ({
    id: p.id,
    ref: p.ref,
    name: p.name,
    publishedLabel: p.publishedDate ? `DEPLOYED ${formatStamp(p.publishedDate)}` : "",
    durationLabel:
      p.devStartDate && p.publishedDate ? `${diffDays(p.devStartDate, p.publishedDate)} D` : "",
  }));

  // ---- Review Queue (PLAN.md "GitHub Dashboard Integration") ----
  const reviewQueue: ReviewQueueRow[] = selectReviewQueue(pullRequests)
    .slice(0, 4)
    .map((pr) => {
      const repo = repositories.find((r) => r.id === pr.repositoryId);
      const project = repo ? projectById.get(repo.projectId) : undefined;
      return {
        id: pr.id,
        projectId: project?.id ?? "",
        projectRef: project?.ref ?? "—",
        number: pr.number,
        title: pr.title,
        state: pr.state,
        checksState: pr.checksState,
      };
    });

  // ---- Event Log (PLAN.md "Recent Activity") ----
  const eventLog: EventLogRow[] = activity.slice(0, 4).map((a) => ({
    id: a.id,
    verb: a.verb,
    subject: a.subject,
    contextRef: a.contextRef,
    tone: a.tone,
    createdAt: a.createdAt,
  }));

  return { metrics, directive, activeBuilds, myDay, upcoming, standby, deployed, reviewQueue, eventLog };
}
