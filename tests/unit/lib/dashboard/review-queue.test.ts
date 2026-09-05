import { describe, expect, it } from "vitest";
import { selectReviewQueue } from "@/lib/dashboard/review-queue";
import type { ChecksState, PullRequestState } from "@/lib/types";

function pr(state: PullRequestState, checksState: ChecksState | null, reviewerCount = 0) {
  return { state, checksState, reviewerCount };
}

describe("selectReviewQueue", () => {
  it("includes PRs explicitly in 'review' state", () => {
    expect(selectReviewQueue([pr("review", null)])).toHaveLength(1);
  });

  it("includes open PRs with failing checks", () => {
    expect(selectReviewQueue([pr("open", "fail")])).toHaveLength(1);
  });

  it("includes open PRs with at least one reviewer assigned", () => {
    expect(selectReviewQueue([pr("open", "pass", 1)])).toHaveLength(1);
  });

  it("excludes open PRs with passing checks and no reviewers", () => {
    expect(selectReviewQueue([pr("open", "pass", 0)])).toHaveLength(0);
  });

  it("excludes draft and merged PRs even with failing checks", () => {
    expect(selectReviewQueue([pr("draft", "fail"), pr("merged", "fail")])).toHaveLength(0);
  });

  it("excludes closed PRs", () => {
    expect(selectReviewQueue([pr("closed", "fail")])).toHaveLength(0);
  });

  it("mixes multiple qualifying reasons correctly", () => {
    const prs = [
      pr("review", "pass"), // qualifies: review state
      pr("open", "fail"), // qualifies: failing checks
      pr("open", "pass", 2), // qualifies: has reviewers
      pr("open", "pass", 0), // does not qualify
      pr("merged", "fail"), // does not qualify
    ];
    expect(selectReviewQueue(prs)).toHaveLength(3);
  });
});
