import type { SequenceStep } from "@/lib/ui/sequence";

/**
 * Step copy for PURGE's post-countdown buffer (components/projects/PurgeSequence.tsx).
 * Describes, honestly, what actually happens on delete: the `projects` row
 * goes, and everything FK-cascades from it (tasks, notes, links, the
 * repository row and its synced commits/branches/PRs) — nothing on GitHub
 * itself is ever touched, see lib/projects/actions.ts's `purgeProject`.
 */
export const PURGE_STEPS: SequenceStep[] = [
  { label: "SEVERING TASK RECORDS", detail: "TASKS · NOTES · LINKS" },
  { label: "SEVERING SOURCE LINK", detail: "REPOSITORY · SYNC HISTORY" },
  { label: "PURGING HULL RECORD", detail: "PROJECTS TABLE" },
];

export const PURGE_FAILED_STEP: SequenceStep = {
  label: "PURGE FAILED",
  detail: "NOTHING WAS DELETED",
};
