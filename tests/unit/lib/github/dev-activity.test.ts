import { describe, expect, it } from "vitest";
import { bucketCommitsByWeek, summarizeActivityByRepo } from "@/lib/github/dev-activity";

describe("bucketCommitsByWeek", () => {
  it("puts today's commit in the last (most recent) bucket", () => {
    expect(bucketCommitsByWeek(["2026-09-05"], 2, "2026-09-05")).toEqual([0, 1]);
  });

  it("puts a commit from 6 days ago in the same bucket as today", () => {
    expect(bucketCommitsByWeek(["2026-08-30"], 2, "2026-09-05")).toEqual([0, 1]);
  });

  it("puts a commit from exactly 7 days ago in the previous bucket", () => {
    expect(bucketCommitsByWeek(["2026-08-29"], 2, "2026-09-05")).toEqual([1, 0]);
  });

  it("drops a commit older than the whole window", () => {
    expect(bucketCommitsByWeek(["2026-08-22"], 2, "2026-09-05")).toEqual([0, 0]);
  });

  it("ignores a commit dated in the future", () => {
    expect(bucketCommitsByWeek(["2026-09-10"], 2, "2026-09-05")).toEqual([0, 0]);
  });

  it("counts multiple commits landing in the same bucket", () => {
    expect(bucketCommitsByWeek(["2026-09-05", "2026-09-04", "2026-09-01"], 2, "2026-09-05")).toEqual([
      0, 3,
    ]);
  });

  it("returns all-zero buckets for no commits", () => {
    expect(bucketCommitsByWeek([], 4, "2026-09-05")).toEqual([0, 0, 0, 0]);
  });
});

describe("summarizeActivityByRepo", () => {
  const labels = [
    { repositoryId: "r1", projectRef: "PRJ-01", projectName: "Shipyard" },
    { repositoryId: "r2", projectRef: "PRJ-02", projectName: "Orbit" },
  ];

  it("counts commits per repository", () => {
    const commits = [{ repositoryId: "r1" }, { repositoryId: "r1" }, { repositoryId: "r2" }];
    const result = summarizeActivityByRepo(commits, [], labels);
    expect(result).toEqual([
      { projectRef: "PRJ-01", projectName: "Shipyard", commitCount: 2, openPrCount: 0 },
      { projectRef: "PRJ-02", projectName: "Orbit", commitCount: 1, openPrCount: 0 },
    ]);
  });

  it("counts only open/review/draft pull requests, not merged or closed", () => {
    const prs = [
      { repositoryId: "r1", state: "open" },
      { repositoryId: "r1", state: "merged" },
      { repositoryId: "r1", state: "closed" },
      { repositoryId: "r1", state: "review" },
    ];
    const result = summarizeActivityByRepo([], prs, labels);
    expect(result.find((r) => r.projectRef === "PRJ-01")?.openPrCount).toBe(2);
  });

  it("sorts by commit count, busiest repo first", () => {
    const commits = [{ repositoryId: "r2" }, { repositoryId: "r1" }, { repositoryId: "r1" }];
    const result = summarizeActivityByRepo(commits, [], labels);
    expect(result.map((r) => r.projectRef)).toEqual(["PRJ-01", "PRJ-02"]);
  });

  it("returns an empty list when there's no activity at all", () => {
    expect(summarizeActivityByRepo([], [], labels)).toEqual([]);
  });

  it("falls back gracefully for a repository id with no matching label", () => {
    const result = summarizeActivityByRepo([{ repositoryId: "unknown" }], [], labels);
    expect(result).toEqual([{ projectRef: "—", projectName: "Unknown", commitCount: 1, openPrCount: 0 }]);
  });
});
