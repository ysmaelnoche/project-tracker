import { describe, expect, it } from "vitest";
import { buildDashboardView } from "@/lib/dashboard/build-view";
import type { ActivityEvent, GhCommit, GhPullRequest, Project, Repository, Task } from "@/lib/types";

const TODAY = "2026-09-05";

function project(overrides: Partial<Project>): Project {
  return {
    id: "p1",
    ref: "PRJ-01",
    name: "Orbit",
    description: "A personal project.",
    type: "personal",
    status: "in_development",
    priority: "medium",
    devStartDate: "2026-08-01",
    targetDate: null,
    publishedDate: null,
    archivedAt: null,
    notes: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    links: [],
    ...overrides,
  };
}

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    ref: "TSK-0001",
    projectId: null,
    title: "Untitled",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    dueTime: null,
    completedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function activity(overrides: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: "a1",
    verb: "TASK CREATED",
    subject: "Implement timer",
    contextRef: "PRJ-01",
    tone: "quiet",
    createdAt: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

function repo(overrides: Partial<Repository>): Repository {
  return {
    id: "r1",
    projectId: "p1",
    owner: "ysmael",
    name: "orbit",
    defaultBranch: "main",
    visibility: "private",
    lastSyncedAt: null,
    lastPushAt: null,
    lastSyncError: null,
    ...overrides,
  };
}

function pr(overrides: Partial<GhPullRequest>): GhPullRequest {
  return {
    id: "pr1",
    repositoryId: "r1",
    taskId: null,
    number: 1,
    title: "Improve dashboard",
    branch: "feature/x",
    state: "open",
    checksState: "pass",
    additions: 10,
    deletions: 2,
    reviewerCount: 0,
    githubUpdatedAt: null,
    mergedAt: null,
    ...overrides,
  };
}

function commit(overrides: Partial<GhCommit>): GhCommit {
  return {
    id: "c1",
    repositoryId: "r1",
    taskId: null,
    sha: "abc1234",
    message: "Fix bug",
    branch: "main",
    authoredAt: "2026-09-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildDashboardView", () => {
  it("wires an active project's own next task through to both the Active Builds card and the Primary Directive", () => {
    const orbit = project({ id: "p1", ref: "PRJ-01", name: "Orbit", status: "in_development" });
    const tasks = [
      task({ id: "t1", projectId: "p1", title: "Implement timer", status: "todo", priority: "high" }),
      task({ id: "t2", projectId: "p1", title: "Write docs", status: "done" }),
    ];

    const view = buildDashboardView({
      projects: [orbit],
      tasks,
      activity: [],
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "all",
      today: TODAY,
    });

    expect(view.activeBuilds).toHaveLength(1);
    expect(view.activeBuilds[0]?.nextTaskTitle).toBe("Implement timer");
    expect(view.activeBuilds[0]?.doneTasks).toBe(1);
    expect(view.activeBuilds[0]?.totalTasks).toBe(2);

    expect(view.directive).not.toBeNull();
    expect(view.directive?.task.title).toBe("Implement timer");
    expect(view.directive?.projectRef).toBe("PRJ-01");
  });

  it("has no directive when there are no active projects with an open task", () => {
    const view = buildDashboardView({
      projects: [project({ id: "p1", status: "pending" })],
      tasks: [],
      activity: [],
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "all",
      today: TODAY,
    });
    expect(view.directive).toBeNull();
  });

  it("omits a project's GitHub snippet entirely when it has no connected repository", () => {
    const view = buildDashboardView({
      projects: [project({ id: "p1", status: "in_development" })],
      tasks: [],
      activity: [],
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "all",
      today: TODAY,
    });
    expect(view.activeBuilds[0]?.githubSnippet).toBeNull();
  });

  it("builds a GitHub snippet from today's commits and open PRs when a repo is connected", () => {
    const view = buildDashboardView({
      projects: [project({ id: "p1", status: "in_development" })],
      tasks: [],
      activity: [],
      repositories: [repo({ id: "r1", projectId: "p1" })],
      pullRequests: [pr({ id: "pr1", repositoryId: "r1", state: "open" })],
      commits: [
        commit({ id: "c1", repositoryId: "r1", authoredAt: `${TODAY}T09:00:00.000Z` }),
        commit({ id: "c2", repositoryId: "r1", authoredAt: `${TODAY}T11:00:00.000Z` }),
        commit({ id: "c3", repositoryId: "r1", authoredAt: "2026-09-01T09:00:00.000Z" }),
      ],
      scope: "all",
      today: TODAY,
    });
    expect(view.activeBuilds[0]?.githubSnippet).toContain("2 commits today");
    expect(view.activeBuilds[0]?.githubSnippet).toContain("1 open PR");
  });

  it("counts OPEN PRS in metrics excluding merged and closed", () => {
    const view = buildDashboardView({
      projects: [],
      tasks: [],
      activity: [],
      repositories: [repo({ id: "r1", projectId: "p1" })],
      pullRequests: [
        pr({ id: "pr1", state: "open" }),
        pr({ id: "pr2", state: "review" }),
        pr({ id: "pr3", state: "merged" }),
        pr({ id: "pr4", state: "closed" }),
      ],
      commits: [],
      scope: "all",
      today: TODAY,
    });
    expect(view.metrics.find((m) => m.label === "OPEN PRS")?.value).toBe("02");
  });

  it("builds the review queue joined with the project ref for display", () => {
    const view = buildDashboardView({
      projects: [project({ id: "p1", ref: "PRJ-01" })],
      tasks: [],
      activity: [],
      repositories: [repo({ id: "r1", projectId: "p1" })],
      pullRequests: [pr({ id: "pr1", repositoryId: "r1", state: "review" })],
      commits: [],
      scope: "all",
      today: TODAY,
    });
    expect(view.reviewQueue).toHaveLength(1);
    expect(view.reviewQueue[0]?.projectRef).toBe("PRJ-01");
    expect(view.reviewQueue[0]?.number).toBe(1);
  });

  it("takes only the latest 4 activity rows for the event log", () => {
    const rows = Array.from({ length: 6 }, (_, i) => activity({ id: `a${i}`, subject: `Event ${i}` }));
    const view = buildDashboardView({
      projects: [],
      tasks: [],
      activity: rows,
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "all",
      today: TODAY,
    });
    expect(view.eventLog).toHaveLength(4);
    expect(view.eventLog[0]?.subject).toBe("Event 0");
  });

  it("scopes active builds, standby, deployed, my day and upcoming by project type", () => {
    const view = buildDashboardView({
      projects: [
        project({ id: "p1", type: "personal", status: "in_development" }),
        project({ id: "p2", type: "work", status: "in_development" }),
        project({ id: "p3", type: "work", status: "pending" }),
      ],
      tasks: [],
      activity: [],
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "personal",
      today: TODAY,
    });
    expect(view.activeBuilds.map((p) => p.id)).toEqual(["p1"]);
    expect(view.standby).toHaveLength(0);
  });

  it("does not scope the metrics bar (always global totals)", () => {
    const view = buildDashboardView({
      projects: [
        project({ id: "p1", type: "personal", status: "in_development" }),
        project({ id: "p2", type: "work", status: "in_development" }),
      ],
      tasks: [],
      activity: [],
      repositories: [],
      pullRequests: [],
      commits: [],
      scope: "personal",
      today: TODAY,
    });
    expect(view.metrics.find((m) => m.label === "IN BUILD")?.value).toBe("02");
  });
});
