import { describe, expect, it } from "vitest";
import { buildSyncPlan, isSemverTag } from "@/lib/github/automations";
import type { SyncSettings, FetchedCommit, FetchedBranch, FetchedPullRequest } from "@/lib/github/automations";
import type { TaskRefMap } from "@/lib/github/linking";

const ALL_ON: SyncSettings = {
  commitLinking: true,
  branchBinding: true,
  firstCommitActivatesTask: true,
  prMergeClosesTask: true,
  tagMarksProduction: true,
  staleBranchAlert: true,
};

const ALL_OFF: SyncSettings = {
  commitLinking: false,
  branchBinding: false,
  firstCommitActivatesTask: false,
  prMergeClosesTask: false,
  tagMarksProduction: false,
  staleBranchAlert: false,
};

const NOW = new Date("2026-09-05T12:00:00.000Z");

function commit(overrides: Partial<FetchedCommit>): FetchedCommit {
  return {
    sha: "abc1234",
    message: "chore: something",
    branch: "main",
    authoredAt: "2026-09-05T09:00:00.000Z",
    ...overrides,
  };
}

function branch(overrides: Partial<FetchedBranch>): FetchedBranch {
  return {
    name: "main",
    aheadBy: 0,
    behindBy: 0,
    lastCommitAt: "2026-09-05T09:00:00.000Z",
    ...overrides,
  };
}

function pr(overrides: Partial<FetchedPullRequest>): FetchedPullRequest {
  return {
    number: 1,
    title: "Some PR",
    body: null,
    branch: "tsk-0001-feature",
    state: "open",
    checksState: null,
    additions: 10,
    deletions: 2,
    reviewerCount: 0,
    githubUpdatedAt: "2026-09-05T09:00:00.000Z",
    ...overrides,
  };
}

function basePlanInput(overrides: Partial<Parameters<typeof buildSyncPlan>[0]> = {}) {
  const tasksByRef: TaskRefMap = new Map();
  return {
    settings: ALL_ON,
    tasksByRef,
    commits: [] as FetchedCommit[],
    branches: [] as FetchedBranch[],
    pullRequests: [] as FetchedPullRequest[],
    existingBranchCommitCounts: {} as Record<string, number>,
    tags: [] as { name: string; sha: string }[],
    defaultBranchHeadSha: "headsha",
    now: NOW,
    ...overrides,
  };
}

describe("isSemverTag", () => {
  it("accepts v-prefixed semver-ish tags", () => {
    expect(isSemverTag("v1.0.0")).toBe(true);
    expect(isSemverTag("v2")).toBe(true);
    expect(isSemverTag("v1.2")).toBe(true);
    expect(isSemverTag("V1.2.3")).toBe(true);
  });

  it("rejects tags without a v prefix or without digits", () => {
    expect(isSemverTag("1.0.0")).toBe(false);
    expect(isSemverTag("release-1.0")).toBe(false);
    expect(isSemverTag("v")).toBe(false);
    expect(isSemverTag("version1")).toBe(false);
  });
});

describe("buildSyncPlan — commit linking", () => {
  it("links a commit whose message contains a known task ref", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({ tasksByRef, commits: [commit({ sha: "c1", message: "feat: TSK-0102 rls" })] }),
    );
    expect(plan.commits).toEqual([
      expect.objectContaining({ sha: "c1", taskId: "task-1" }),
    ]);
  });

  it("leaves taskId null when no ref is found", () => {
    const plan = buildSyncPlan(basePlanInput({ commits: [commit({ sha: "c1", message: "chore: bump" })] }));
    expect(plan.commits[0]).toMatchObject({ taskId: null });
  });

  it("skips linking entirely when commit_linking is off", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, commitLinking: false },
        tasksByRef,
        commits: [commit({ sha: "c1", message: "feat: TSK-0102 rls" })],
      }),
    );
    expect(plan.commits[0]).toMatchObject({ taskId: null });
  });
});

describe("buildSyncPlan — branch binding", () => {
  it("links a branch whose name contains a known task ref", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "in_progress" }]]);
    const plan = buildSyncPlan(
      basePlanInput({ tasksByRef, branches: [branch({ name: "tsk-0102-rls-policies" })] }),
    );
    expect(plan.branches[0]).toMatchObject({ taskId: "task-1" });
  });

  it("skips linking entirely when branch_binding is off", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "in_progress" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, branchBinding: false },
        tasksByRef,
        branches: [branch({ name: "tsk-0102-rls-policies" })],
      }),
    );
    expect(plan.branches[0]).toMatchObject({ taskId: null });
  });

  it("leaves an unbound branch's taskId null", () => {
    const plan = buildSyncPlan(basePlanInput({ branches: [branch({ name: "spike/exploration" })] }));
    expect(plan.branches[0]).toMatchObject({ taskId: null });
  });
});

describe("buildSyncPlan — first commit activates task", () => {
  it("activates a todo task on a bound branch's first-ever commit", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        branches: [branch({ name: "tsk-0102-rls" })],
        commits: [commit({ sha: "c1", branch: "tsk-0102-rls", message: "wip" })],
        existingBranchCommitCounts: {},
      }),
    );
    expect(plan.taskActivations).toEqual([{ taskId: "task-1" }]);
  });

  it("does not activate when the branch already had commits before this sync", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        branches: [branch({ name: "tsk-0102-rls" })],
        commits: [commit({ sha: "c2", branch: "tsk-0102-rls", message: "more work" })],
        existingBranchCommitCounts: { "tsk-0102-rls": 3 },
      }),
    );
    expect(plan.taskActivations).toEqual([]);
  });

  it("does not activate a task that is already in_progress or done", () => {
    const tasksByRef: TaskRefMap = new Map([
      ["TSK-0102", { id: "task-1", status: "in_progress" }],
      ["TSK-0200", { id: "task-2", status: "done" }],
    ]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        branches: [branch({ name: "tsk-0102-a" }), branch({ name: "tsk-0200-b" })],
        commits: [
          commit({ sha: "c1", branch: "tsk-0102-a" }),
          commit({ sha: "c2", branch: "tsk-0200-b" }),
        ],
      }),
    );
    expect(plan.taskActivations).toEqual([]);
  });

  it("does not activate when there is no fetched commit on the branch this sync", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        branches: [branch({ name: "tsk-0102-rls" })],
        commits: [],
      }),
    );
    expect(plan.taskActivations).toEqual([]);
  });

  it("does nothing when first_commit_activates_task is off", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, firstCommitActivatesTask: false },
        tasksByRef,
        branches: [branch({ name: "tsk-0102-rls" })],
        commits: [commit({ sha: "c1", branch: "tsk-0102-rls" })],
      }),
    );
    expect(plan.taskActivations).toEqual([]);
  });
});

describe("buildSyncPlan — PR merge closes task", () => {
  it("closes the linked task when a PR is merged", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "in_progress" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        pullRequests: [pr({ number: 5, title: "Fix TSK-0102", state: "merged" })],
      }),
    );
    expect(plan.pullRequests[0]).toMatchObject({ taskId: "task-1" });
    expect(plan.taskCompletions).toEqual([{ taskId: "task-1" }]);
  });

  it("matches the ref in the PR body when the title has no ref", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0055", { id: "task-9", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        pullRequests: [pr({ number: 6, title: "Fix a bug", body: "Closes TSK-0055", state: "merged" })],
      }),
    );
    expect(plan.taskCompletions).toEqual([{ taskId: "task-9" }]);
  });

  it("does not re-close a task that is already done", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "done" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        pullRequests: [pr({ number: 5, title: "Fix TSK-0102", state: "merged" })],
      }),
    );
    expect(plan.taskCompletions).toEqual([]);
  });

  it("does not close a task for an open (not merged) PR", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "in_progress" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        tasksByRef,
        pullRequests: [pr({ number: 5, title: "Fix TSK-0102", state: "open" })],
      }),
    );
    expect(plan.taskCompletions).toEqual([]);
  });

  it("does nothing when pr_merge_closes_task is off (but linking still applies)", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "in_progress" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, prMergeClosesTask: false },
        tasksByRef,
        pullRequests: [pr({ number: 5, title: "Fix TSK-0102", state: "merged" })],
      }),
    );
    expect(plan.pullRequests[0]).toMatchObject({ taskId: "task-1" });
    expect(plan.taskCompletions).toEqual([]);
  });
});

describe("buildSyncPlan — stale branch alert", () => {
  it("flags a branch whose last commit is 14+ days old", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        branches: [branch({ name: "old", lastCommitAt: "2026-08-15T00:00:00.000Z" })], // 21 days before NOW
      }),
    );
    expect(plan.branches[0]).toMatchObject({ isStale: true });
  });

  it("does not flag a branch committed to within the last 14 days", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        branches: [branch({ name: "fresh", lastCommitAt: "2026-09-01T00:00:00.000Z" })], // 4 days before NOW
      }),
    );
    expect(plan.branches[0]).toMatchObject({ isStale: false });
  });

  it("does not flag a branch with no known last-commit date", () => {
    const plan = buildSyncPlan(basePlanInput({ branches: [branch({ name: "unknown", lastCommitAt: null })] }));
    expect(plan.branches[0]).toMatchObject({ isStale: false });
  });

  it("clears staleness for every branch when stale_branch_alert is off", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, staleBranchAlert: false },
        branches: [branch({ name: "old", lastCommitAt: "2026-08-01T00:00:00.000Z" })],
      }),
    );
    expect(plan.branches[0]).toMatchObject({ isStale: false });
  });
});

describe("buildSyncPlan — tag marks production", () => {
  it("wants to mark production when a semver tag points at the default branch head", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        defaultBranchHeadSha: "headsha",
        tags: [{ name: "v1.0.0", sha: "headsha" }],
      }),
    );
    expect(plan.shouldMarkProduction).toBe(true);
  });

  it("does not want to mark production when the tag isn't on the default branch head", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        defaultBranchHeadSha: "headsha",
        tags: [{ name: "v1.0.0", sha: "some-other-sha" }],
      }),
    );
    expect(plan.shouldMarkProduction).toBe(false);
  });

  it("does not want to mark production for a non-semver tag", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        defaultBranchHeadSha: "headsha",
        tags: [{ name: "nightly-build", sha: "headsha" }],
      }),
    );
    expect(plan.shouldMarkProduction).toBe(false);
  });

  it("defaults off: does nothing when tag_marks_production is off, even with a matching tag", () => {
    const plan = buildSyncPlan(
      basePlanInput({
        settings: { ...ALL_ON, tagMarksProduction: false },
        defaultBranchHeadSha: "headsha",
        tags: [{ name: "v1.0.0", sha: "headsha" }],
      }),
    );
    expect(plan.shouldMarkProduction).toBe(false);
  });
});

describe("buildSyncPlan — everything off", () => {
  it("produces no side effects and null links when every automation is disabled", () => {
    const tasksByRef: TaskRefMap = new Map([["TSK-0102", { id: "task-1", status: "todo" }]]);
    const plan = buildSyncPlan(
      basePlanInput({
        settings: ALL_OFF,
        tasksByRef,
        commits: [commit({ sha: "c1", message: "TSK-0102", branch: "tsk-0102-a" })],
        branches: [branch({ name: "tsk-0102-a", lastCommitAt: "2026-01-01T00:00:00.000Z" })],
        pullRequests: [pr({ number: 1, title: "TSK-0102", state: "merged" })],
        tags: [{ name: "v1.0.0", sha: "headsha" }],
      }),
    );
    expect(plan.commits[0]).toMatchObject({ taskId: null });
    expect(plan.branches[0]).toMatchObject({ taskId: null, isStale: false });
    expect(plan.pullRequests[0]).toMatchObject({ taskId: null });
    expect(plan.taskActivations).toEqual([]);
    expect(plan.taskCompletions).toEqual([]);
    expect(plan.shouldMarkProduction).toBe(false);
  });
});
