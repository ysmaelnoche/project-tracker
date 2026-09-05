import { describe, expect, it } from "vitest";
import {
  deriveChecksState,
  shapeCommit,
  shapeBranchFromCompare,
  shapePullRequest,
  toBranchRow,
  toCommitRow,
  toPullRequestRow,
} from "@/lib/github/shape";

describe("shapeCommit", () => {
  it("maps sha, first line of the message, branch, and author date", () => {
    const raw = {
      sha: "abc1234567",
      commit: {
        message: "feat: add thing\n\nLonger body explaining why.",
        author: { date: "2026-09-05T09:41:00.000Z" },
      },
    };
    expect(shapeCommit(raw, "main")).toEqual({
      sha: "abc1234567",
      message: "feat: add thing",
      branch: "main",
      authoredAt: "2026-09-05T09:41:00.000Z",
    });
  });

  it("falls back to the committer date when author date is missing", () => {
    const raw = {
      sha: "abc",
      commit: { message: "chore: x", committer: { date: "2026-09-01T00:00:00.000Z" } },
    };
    expect(shapeCommit(raw, null).authoredAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("accepts a null branch (for commits not attributed to a specific branch)", () => {
    const raw = { sha: "abc", commit: { message: "x", author: { date: "2026-01-01T00:00:00.000Z" } } };
    expect(shapeCommit(raw, null).branch).toBeNull();
  });
});

describe("shapeBranchFromCompare", () => {
  it("maps ahead_by/behind_by and shapes each unique commit under the branch name", () => {
    const compare = {
      ahead_by: 2,
      behind_by: 1,
      commits: [
        { sha: "c1", commit: { message: "first", author: { date: "2026-09-01T00:00:00.000Z" } } },
        { sha: "c2", commit: { message: "second", author: { date: "2026-09-02T00:00:00.000Z" } } },
      ],
    };
    const result = shapeBranchFromCompare("feature/x", compare);
    expect(result.branch).toEqual({
      name: "feature/x",
      aheadBy: 2,
      behindBy: 1,
      lastCommitAt: "2026-09-02T00:00:00.000Z",
    });
    expect(result.commits).toEqual([
      { sha: "c1", message: "first", branch: "feature/x", authoredAt: "2026-09-01T00:00:00.000Z" },
      { sha: "c2", message: "second", branch: "feature/x", authoredAt: "2026-09-02T00:00:00.000Z" },
    ]);
  });

  it("handles a branch with no commits ahead of the default branch", () => {
    const result = shapeBranchFromCompare("fresh", { ahead_by: 0, behind_by: 0, commits: [] });
    expect(result.branch).toEqual({ name: "fresh", aheadBy: 0, behindBy: 0, lastCommitAt: null });
    expect(result.commits).toEqual([]);
  });
});

describe("deriveChecksState", () => {
  it("returns null when there are no check runs", () => {
    expect(deriveChecksState([])).toBeNull();
  });

  it("returns 'running' when any run hasn't completed", () => {
    expect(deriveChecksState([{ status: "completed", conclusion: "success" }, { status: "in_progress", conclusion: null }])).toBe(
      "running",
    );
  });

  it("returns 'fail' when a completed run failed", () => {
    expect(deriveChecksState([{ status: "completed", conclusion: "success" }, { status: "completed", conclusion: "failure" }])).toBe(
      "fail",
    );
  });

  it("returns 'pass' when every run completed successfully", () => {
    expect(deriveChecksState([{ status: "completed", conclusion: "success" }])).toBe("pass");
  });
});

describe("shapePullRequest", () => {
  const base = {
    number: 42,
    title: "Improve dashboard layout",
    body: "Closes TSK-0001",
    head: { ref: "tsk-0001-dashboard" },
    state: "open" as const,
    draft: false,
    merged_at: null,
    updated_at: "2026-09-05T09:00:00.000Z",
    additions: 100,
    deletions: 20,
    requested_reviewers: [{ login: "someone" }],
  };

  it("maps a merged PR, carrying its exact merge timestamp", () => {
    const shaped = shapePullRequest(
      { ...base, state: "closed", merged_at: "2026-09-05T10:00:00.000Z" },
      { hasChangesRequested: false },
      null,
    );
    expect(shaped.state).toBe("merged");
    expect(shaped.mergedAt).toBe("2026-09-05T10:00:00.000Z");
  });

  it("carries a null mergedAt for a PR that hasn't merged", () => {
    const shaped = shapePullRequest(base, { hasChangesRequested: false }, null);
    expect(shaped.mergedAt).toBeNull();
  });

  it("maps a closed-without-merge PR", () => {
    const shaped = shapePullRequest({ ...base, state: "closed", merged_at: null }, { hasChangesRequested: false }, null);
    expect(shaped.state).toBe("closed");
  });

  it("maps a draft PR", () => {
    const shaped = shapePullRequest({ ...base, draft: true }, { hasChangesRequested: false }, null);
    expect(shaped.state).toBe("draft");
  });

  it("maps an open PR with changes requested to 'review'", () => {
    const shaped = shapePullRequest(base, { hasChangesRequested: true }, null);
    expect(shaped.state).toBe("review");
  });

  it("maps a plain open PR to 'open'", () => {
    const shaped = shapePullRequest(base, { hasChangesRequested: false }, "pass");
    expect(shaped.state).toBe("open");
    expect(shaped.checksState).toBe("pass");
  });

  it("carries additions/deletions/branch/body and derives reviewerCount", () => {
    const shaped = shapePullRequest(base, { hasChangesRequested: false }, null);
    expect(shaped).toMatchObject({
      number: 42,
      title: "Improve dashboard layout",
      body: "Closes TSK-0001",
      branch: "tsk-0001-dashboard",
      additions: 100,
      deletions: 20,
      reviewerCount: 1,
      githubUpdatedAt: "2026-09-05T09:00:00.000Z",
    });
  });

  it("defaults additions/deletions/reviewerCount to 0 when absent", () => {
    const { additions, deletions, requested_reviewers, ...rest } = base;
    const shaped = shapePullRequest(rest, { hasChangesRequested: false }, null);
    expect(shaped.additions).toBe(0);
    expect(shaped.deletions).toBe(0);
    expect(shaped.reviewerCount).toBe(0);
  });
});

describe("upsert-shape helpers", () => {
  it("toCommitRow shapes a planned commit for the gh_commits table", () => {
    expect(
      toCommitRow("repo-1", { sha: "c1", message: "msg", branch: "main", authoredAt: "2026-09-05T00:00:00.000Z", taskId: "t1" }),
    ).toEqual({
      repository_id: "repo-1",
      task_id: "t1",
      sha: "c1",
      message: "msg",
      branch: "main",
      authored_at: "2026-09-05T00:00:00.000Z",
    });
  });

  it("toBranchRow shapes a planned branch for the gh_branches table", () => {
    expect(
      toBranchRow("repo-1", {
        name: "main",
        aheadBy: 1,
        behindBy: 2,
        lastCommitAt: "2026-09-05T00:00:00.000Z",
        taskId: null,
        isStale: false,
      }),
    ).toEqual({
      repository_id: "repo-1",
      task_id: null,
      name: "main",
      ahead_by: 1,
      behind_by: 2,
      last_commit_at: "2026-09-05T00:00:00.000Z",
      is_stale: false,
    });
  });

  it("toPullRequestRow shapes a planned PR for the gh_pull_requests table", () => {
    expect(
      toPullRequestRow("repo-1", {
        number: 5,
        title: "Title",
        body: "Body",
        branch: "feature",
        state: "open",
        checksState: "pass",
        additions: 1,
        deletions: 2,
        reviewerCount: 1,
        githubUpdatedAt: "2026-09-05T00:00:00.000Z",
        mergedAt: null,
        taskId: "t1",
      }),
    ).toEqual({
      repository_id: "repo-1",
      task_id: "t1",
      number: 5,
      title: "Title",
      branch: "feature",
      state: "open",
      checks_state: "pass",
      additions: 1,
      deletions: 2,
      reviewer_count: 1,
      github_updated_at: "2026-09-05T00:00:00.000Z",
      merged_at: null,
    });
  });
});
