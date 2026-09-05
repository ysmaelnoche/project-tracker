/**
 * "Review Queue" selection (PLAN.md "GitHub Dashboard Integration"): pull
 * requests that need the user's attention. Pure — reads straight off already-
 * fetched `gh_pull_requests` rows; empty until the GitHub slice populates any
 * repositories/PRs, which is correct behavior, not a bug.
 */

import type { ChecksState, PullRequestState } from "@/lib/types";

export interface ReviewQueuePrInput {
  state: PullRequestState;
  checksState: ChecksState | null;
  reviewerCount: number;
}

export function selectReviewQueue<T extends ReviewQueuePrInput>(prs: T[]): T[] {
  return prs.filter(
    (p) =>
      p.state === "review" ||
      (p.state === "open" && p.checksState === "fail") ||
      (p.state === "open" && p.reviewerCount > 0),
  );
}
