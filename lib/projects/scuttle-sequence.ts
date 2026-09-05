import type { SequenceStep } from "@/lib/ui/sequence";

/**
 * Step copy for SCUTTLE's post-confirmation buffer
 * (components/projects/ScuttleSequence.tsx). Describes, honestly, what
 * actually happens on delete: the `projects` row goes, and everything
 * FK-cascades from it (tasks, notes, links, the repository row and its
 * synced commits/branches/PRs) — nothing on GitHub itself is ever touched,
 * see lib/projects/actions.ts's `scuttleProject`.
 */
export const SCUTTLE_STEPS: SequenceStep[] = [
  { label: "SEVERING TASK RECORDS", detail: "TASKS · NOTES · LINKS" },
  { label: "SEVERING SOURCE LINK", detail: "REPOSITORY · SYNC HISTORY" },
  { label: "SCUTTLING HULL RECORD", detail: "PROJECTS TABLE" },
];

export const SCUTTLE_FAILED_STEP: SequenceStep = {
  label: "SCUTTLE FAILED",
  detail: "NOTHING WAS DELETED",
};
