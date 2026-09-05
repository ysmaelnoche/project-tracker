/**
 * Pure view-model for the Access screen's "authenticating" sequence. The
 * step list describes, honestly, what actually happens during sign-in (no
 * fabricated technical detail like specific hash algorithms or record
 * counts) — see lib/auth/actions.ts for the real work each step names.
 *
 * The animation paces these on a timer for a satisfying wait (see
 * components/auth/AccessForm.tsx), but the *outcome* always comes from the
 * real signInWithUsername() result — this file never decides success. The
 * reveal/percent math itself lives in lib/ui/sequence.ts, shared with the
 * CRUD-write "COMMITTING" sequence (lib/ui/committing-sequence.ts) — this
 * file only supplies auth-specific copy.
 */

import { buildSequenceLines, computeSequencePercent } from "@/lib/ui/sequence";
import type { SequenceLine, SequenceStep } from "@/lib/ui/sequence";

export interface AuthStep extends SequenceStep {}

export const AUTH_STEPS: AuthStep[] = [
  { label: "OPENING SECURE CHANNEL", detail: "HTTPS · TLS" },
  { label: "RESOLVING OPERATOR ID", detail: "USERNAME → ACCOUNT" },
  { label: "VERIFYING PASSCODE", detail: "SUPABASE AUTH" },
  { label: "SESSION ESTABLISHED", detail: "SECURE COOKIE ISSUED" },
  { label: "RLS POLICY BOUND", detail: "OWNER = AUTH.UID()" },
  { label: "ACCESS GRANTED", detail: "WELCOME BACK, OPERATOR" },
];

const REJECTION_STEP: SequenceStep = {
  label: "CREDENTIALS REJECTED",
  detail: "USERNAME OR PASSWORD DID NOT MATCH",
};

export type AuthMark = SequenceLine["mark"];
export interface AuthLineView extends SequenceLine {}

export function buildAuthLines(revealed: number, failed: boolean): AuthLineView[] {
  return buildSequenceLines(AUTH_STEPS, revealed, failed, REJECTION_STEP);
}

export function computeAuthPercent(revealed: number, failed: boolean): number {
  return computeSequencePercent(AUTH_STEPS, revealed, failed);
}
