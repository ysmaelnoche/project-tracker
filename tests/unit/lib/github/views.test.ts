import { describe, expect, it } from "vitest";
import {
  buildSourceTabHref,
  computeSourceMetrics,
  isPullRequestOpen,
  parseSourceTab,
  sortPullRequestsForFeed,
} from "@/lib/github/views";
import type { GhPullRequest } from "@/lib/types";

const TODAY = "2026-09-05";

function pr(overrides: Partial<GhPullRequest>): GhPullRequest {
  return {
    id: "pr-1",
    repositoryId: "repo-1",
    taskId: null,
    number: 1,
    title: "Title",
    branch: "feature",
    state: "open",
    checksState: null,
    additions: 0,
    deletions: 0,
    reviewerCount: 0,
    githubUpdatedAt: null,
    ...overrides,
  };
}

describe("isPullRequestOpen", () => {
  it("treats draft/open/review as open", () => {
    expect(isPullRequestOpen("draft")).toBe(true);
    expect(isPullRequestOpen("open")).toBe(true);
    expect(isPullRequestOpen("review")).toBe(true);
  });

  it("treats merged/closed as not open", () => {
    expect(isPullRequestOpen("merged")).toBe(false);
    expect(isPullRequestOpen("closed")).toBe(false);
  });
});

describe("computeSourceMetrics", () => {
  it("computes every metric from the given rows", () => {
    const metrics = computeSourceMetrics({
      repoCount: 3,
      liveProjectCount: 5,
      pullRequests: [
        pr({ state: "open", checksState: "pass" }),
        pr({ state: "review", checksState: "fail" }),
        pr({ state: "merged", checksState: "pass" }),
        pr({ state: "closed", checksState: "fail" }),
      ],
      commits: [
        { authoredAt: `${TODAY}T09:00:00.000Z` },
        { authoredAt: `${TODAY}T20:00:00.000Z` },
        { authoredAt: "2026-09-04T09:00:00.000Z" },
      ],
      branches: [{ isStale: true }, { isStale: false }, { isStale: true }],
      today: TODAY,
    });

    expect(metrics).toEqual({
      linkedRepos: 3,
      totalProjects: 5,
      openPRs: 2, // open + review, not merged/closed
      awaitingReview: 1, // state === 'review'
      failingChecks: 1, // checksState fail AND not merged (the closed+fail one is excluded)
      pushedToday: 2,
      staleBranches: 2,
    });
  });

  it("handles an all-empty repository set without error", () => {
    const metrics = computeSourceMetrics({
      repoCount: 0,
      liveProjectCount: 0,
      pullRequests: [],
      commits: [],
      branches: [],
      today: TODAY,
    });
    expect(metrics).toEqual({
      linkedRepos: 0,
      totalProjects: 0,
      openPRs: 0,
      awaitingReview: 0,
      failingChecks: 0,
      pushedToday: 0,
      staleBranches: 0,
    });
  });
});

describe("sortPullRequestsForFeed", () => {
  it("puts every open/review/draft PR before merged/closed ones", () => {
    const open = pr({ number: 1, state: "open" });
    const merged = pr({ number: 2, state: "merged" });
    const review = pr({ number: 3, state: "review" });
    const sorted = sortPullRequestsForFeed([merged, open, review]);
    expect(sorted.map((p) => p.number)).toEqual([1, 3, 2]);
  });

  it("is stable within each group", () => {
    const a = pr({ number: 1, state: "open" });
    const b = pr({ number: 2, state: "open" });
    expect(sortPullRequestsForFeed([b, a]).map((p) => p.number)).toEqual([2, 1]);
  });
});

describe("parseSourceTab", () => {
  it("passes through known tab keys", () => {
    expect(parseSourceTab("branches")).toBe("branches");
    expect(parseSourceTab("commits")).toBe("commits");
    expect(parseSourceTab("prs")).toBe("prs");
  });

  it("defaults to 'prs' for missing/unknown values", () => {
    expect(parseSourceTab(undefined)).toBe("prs");
    expect(parseSourceTab(null)).toBe("prs");
    expect(parseSourceTab("bogus")).toBe("prs");
  });
});

describe("buildSourceTabHref", () => {
  it("omits the query param for the default tab", () => {
    expect(buildSourceTabHref("prs")).toBe("/source");
  });

  it("sets the tab param for a non-default tab", () => {
    expect(buildSourceTabHref("branches")).toBe("/source?tab=branches");
    expect(buildSourceTabHref("commits")).toBe("/source?tab=commits");
  });
});
