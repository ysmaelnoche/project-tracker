import { LINK_STEPS } from "@/lib/github/link-sequence";
import type { EntryStage } from "@/lib/projects/entry-stage";
import type { SequenceStep } from "@/lib/ui/sequence";

/**
 * Step copy for "Lay a keel"'s COMMITTING sequence — one variant per
 * `EntryStage` (lib/projects/entry-stage.ts), since registering a project
 * that's already under construction or already shipped is a genuinely
 * different act from registering a fresh one, and reads honestly as one:
 * BUILD/DEPLOYED name the record they're actually writing (a build start,
 * a deploy date — never a fabricated history), and end on their own
 * "joining the fleet" beat rather than sharing PENDING's plain ledger
 * step. The uplink phase (lib/github/link-sequence.ts) appends after any
 * of these, unchanged, when the create form's optional repo field was
 * filled in — see `buildKeelSteps`.
 */
export const KEEL_STEPS_PENDING: SequenceStep[] = [
  { label: "ALLOCATING HULL RECORD", detail: "PROJECTS TABLE" },
  { label: "STAMPING REGISTRY NUMBER", detail: "SEQUENTIAL REF" },
  { label: "BINDING TO FLEET LEDGER", detail: "ACTIVITY LOG" },
];

export const KEEL_STEPS_IN_DEVELOPMENT: SequenceStep[] = [
  { label: "ALLOCATING HULL RECORD", detail: "PROJECTS TABLE" },
  { label: "STAMPING REGISTRY NUMBER", detail: "SEQUENTIAL REF" },
  { label: "RECORDING BUILD START", detail: "TODAY" },
  { label: "JOINING FLEET AT BUILD", detail: "ACTIVITY LOG" },
];

export const KEEL_STEPS_DEPLOYED: SequenceStep[] = [
  { label: "ALLOCATING HULL RECORD", detail: "PROJECTS TABLE" },
  { label: "STAMPING REGISTRY NUMBER", detail: "SEQUENTIAL REF" },
  { label: "RECORDING DEPLOYMENT", detail: "TODAY" },
  { label: "JOINING FLEET AT DEPLOYED", detail: "ACTIVITY LOG" },
];

const KEEL_STEPS_BY_STAGE: Record<EntryStage, SequenceStep[]> = {
  pending: KEEL_STEPS_PENDING,
  in_development: KEEL_STEPS_IN_DEVELOPMENT,
  production: KEEL_STEPS_DEPLOYED,
};

/** The payoff line for each entry stage — also the activity-log verb createProject writes, so the animation and the permanent record always agree. */
export const KEEL_PAYOFF: Record<EntryStage, string> = {
  pending: "KEEL LAID",
  in_development: "BUILD LOGGED",
  production: "DEPLOYMENT LOGGED",
};

export function buildKeelSteps(entryStage: EntryStage, withRepo: boolean): SequenceStep[] {
  const steps = KEEL_STEPS_BY_STAGE[entryStage];
  return withRepo ? [...steps, ...LINK_STEPS] : steps;
}
