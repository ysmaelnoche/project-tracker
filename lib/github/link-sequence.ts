import type { SequenceStep } from "@/lib/ui/sequence";

/**
 * Step copy for the "LINKING" sequence — connecting a GitHub repository,
 * whether from the create-project form's optional repo field or the Source
 * panel's own connect form. Distinct headline/payoff from the CRUD
 * "COMMITTING" sequence (lib/ui/sequence.ts's COMMIT_REJECTED_STEP) since
 * this involves a real GitHub round trip, not just a database write.
 */
export const LINK_STEPS: SequenceStep[] = [
  { label: "OPENING GITHUB UPLINK", detail: "OCTOKIT REST" },
  { label: "VERIFYING REPOSITORY", detail: "OWNER/NAME" },
  { label: "BACKFILLING ACTIVITY", detail: "COMMITS · BRANCHES · PRS" },
];

export const LINK_FAILED_STEP: SequenceStep = {
  label: "UPLINK FAILED",
  detail: "REPOSITORY NOT LINKED",
};
