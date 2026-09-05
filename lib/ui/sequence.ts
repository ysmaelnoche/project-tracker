/**
 * Generic engine behind every staged "buffering" panel in the app — the
 * sign-in screen's AUTHENTICATING sequence (`lib/auth/auth-sequence.ts`) and
 * the CRUD-write COMMITTING sequence (`lib/ui/committing-sequence.ts`) both
 * delegate here rather than duplicating the reveal/percent math. Each caller
 * supplies its own step copy and failure-line copy; this only ever decides
 * *how many* lines are showing and *how far along* the bar is.
 *
 * Pure and dependency-free — no timers, no DOM. The caller (a client
 * component) owns pacing a `revealed` counter on an interval and swapping in
 * the real outcome once it's known; see AccessForm/BufferPanel for the
 * pattern.
 */

export interface SequenceStep {
  label: string;
  detail: string;
}

export type SequenceMark = "done" | "failed";

export interface SequenceLine extends SequenceStep {
  num: string;
  mark: SequenceMark;
}

/**
 * `revealed` steps have completed successfully. If `failed`, the *next*
 * unrevealed step (not a later one) is synthesized as `failStep` — the
 * sequence never shows a step succeeding after the point it actually failed,
 * even if `revealed` already covers every step by the time failure is known.
 */
export function buildSequenceLines(
  steps: SequenceStep[],
  revealed: number,
  failed: boolean,
  failStep: SequenceStep,
): SequenceLine[] {
  const doneCount = failed
    ? Math.min(Math.max(revealed, 0), steps.length - 1)
    : Math.min(Math.max(revealed, 0), steps.length);

  const lines: SequenceLine[] = [];
  for (let i = 0; i < doneCount; i++) {
    const step = steps[i]!;
    lines.push({ num: String(i + 1).padStart(2, "0"), label: step.label, detail: step.detail, mark: "done" });
  }

  if (failed) {
    lines.push({
      num: String(doneCount + 1).padStart(2, "0"),
      label: failStep.label,
      detail: failStep.detail,
      mark: "failed",
    });
  }

  return lines;
}

export function computeSequencePercent(steps: SequenceStep[], revealed: number, failed: boolean): number {
  const shown = failed
    ? Math.min(revealed + 1, steps.length)
    : Math.min(Math.max(revealed, 0), steps.length);
  return Math.round((shown / steps.length) * 100);
}

/** Shared failure-line copy for CRUD "COMMITTING" sequences (projects, tasks, …). */
export const COMMIT_REJECTED_STEP: SequenceStep = {
  label: "COMMIT REJECTED",
  detail: "NO CHANGES WERE SAVED",
};
