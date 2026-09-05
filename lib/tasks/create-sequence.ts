import type { SequenceStep } from "@/lib/ui/sequence";

/** Step copy for the "Queue task" form's COMMITTING sequence. */
export const QUEUE_STEPS: SequenceStep[] = [
  { label: "VALIDATING ENTRY", detail: "TITLE · PRIORITY" },
  { label: "ASSIGNING REFERENCE", detail: "SEQUENTIAL REF" },
  { label: "BINDING TO QUEUE", detail: "PROJECT OR STANDALONE" },
];
