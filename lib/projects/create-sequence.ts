import { LINK_STEPS } from "@/lib/github/link-sequence";
import type { SequenceStep } from "@/lib/ui/sequence";

/**
 * Step copy for "Lay a keel"'s COMMITTING sequence. The uplink phase
 * (lib/github/link-sequence.ts) only appears when the create form's
 * optional repo field was filled in — see `buildKeelSteps`.
 */
export const KEEL_STEPS: SequenceStep[] = [
  { label: "ALLOCATING HULL RECORD", detail: "PROJECTS TABLE" },
  { label: "STAMPING REGISTRY NUMBER", detail: "SEQUENTIAL REF" },
  { label: "BINDING TO FLEET LEDGER", detail: "ACTIVITY LOG" },
];

export function buildKeelSteps(withRepo: boolean): SequenceStep[] {
  return withRepo ? [...KEEL_STEPS, ...LINK_STEPS] : KEEL_STEPS;
}
