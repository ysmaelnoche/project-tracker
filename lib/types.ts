/**
 * Shared domain types, mirroring `supabase/migrations/0001_init.sql`.
 *
 * This file is the contract every feature slice builds against — if the schema
 * changes, update it here first so UI and data-access code stay in sync.
 */

export type ProjectType = "personal" | "work";

export type ProjectStatus =
  | "pending"
  | "in_development"
  | "paused"
  | "production"
  | "archived";

export type Priority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface Project {
  id: string;
  ref: string; // e.g. "PRJ-01"
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  devStartDate: string | null; // ISO date
  targetDate: string | null;
  publishedDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  links: ProjectLink[];
}

export interface Task {
  id: string;
  ref: string; // e.g. "TSK-0102"
  projectId: string | null; // null = standalone personal task
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  dueTime: string | null; // "HH:MM", for meeting-shaped standalone tasks
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivityTone = "teal" | "accent" | "quiet" | "red";

export interface ActivityEvent {
  id: string;
  verb: string;
  subject: string;
  contextRef: string | null;
  tone: ActivityTone;
  createdAt: string;
}

export type RepoVisibility = "public" | "private";

export interface Repository {
  id: string;
  projectId: string;
  owner: string;
  name: string; // slug = `${owner}/${name}`
  defaultBranch: string;
  visibility: RepoVisibility | null;
  lastSyncedAt: string | null;
  lastPushAt: string | null;
  lastSyncError: string | null;
}

export type BranchState = "active" | "fresh" | "stale";

export interface GhBranch {
  id: string;
  repositoryId: string;
  taskId: string | null;
  name: string;
  aheadBy: number;
  behindBy: number;
  lastCommitAt: string | null;
  isStale: boolean;
}

export type PullRequestState = "draft" | "open" | "review" | "merged" | "closed";
export type ChecksState = "pass" | "fail" | "running";

export interface GhPullRequest {
  id: string;
  repositoryId: string;
  taskId: string | null;
  number: number;
  title: string;
  branch: string | null;
  state: PullRequestState;
  checksState: ChecksState | null;
  additions: number;
  deletions: number;
  reviewerCount: number;
  githubUpdatedAt: string | null;
}

export interface GhCommit {
  id: string;
  repositoryId: string;
  taskId: string | null;
  sha: string;
  message: string;
  branch: string | null;
  authoredAt: string;
}

export interface AutomationSettings {
  commitLinking: boolean;
  branchBinding: boolean;
  firstCommitActivatesTask: boolean;
  prMergeClosesTask: boolean;
  tagMarksProduction: boolean;
  staleBranchAlert: boolean;
  confirmBeforeArchive: boolean;
}

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  commitLinking: true,
  branchBinding: true,
  firstCommitActivatesTask: true,
  prMergeClosesTask: true,
  tagMarksProduction: false,
  staleBranchAlert: true,
  confirmBeforeArchive: true,
};
