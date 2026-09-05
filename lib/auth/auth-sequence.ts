/**
 * Pure view-model for the Access screen's "authenticating" sequence. The
 * step list describes, honestly, what actually happens during sign-in (no
 * fabricated technical detail like specific hash algorithms or record
 * counts) — see lib/auth/actions.ts for the real work each step names.
 *
 * The animation paces these on a timer for a satisfying wait (see
 * components/auth/AccessForm.tsx), but the *outcome* always comes from the
 * real signInWithUsername() result — this file never decides success.
 */

export interface AuthStep {
  label: string;
  detail: string;
}

export const AUTH_STEPS: AuthStep[] = [
  { label: "OPENING SECURE CHANNEL", detail: "HTTPS · TLS" },
  { label: "RESOLVING OPERATOR ID", detail: "USERNAME → ACCOUNT" },
  { label: "VERIFYING PASSCODE", detail: "SUPABASE AUTH" },
  { label: "SESSION ESTABLISHED", detail: "SECURE COOKIE ISSUED" },
  { label: "RLS POLICY BOUND", detail: "OWNER = AUTH.UID()" },
  { label: "ACCESS GRANTED", detail: "WELCOME BACK, OPERATOR" },
];

export type AuthMark = "done" | "failed";

export interface AuthLineView {
  num: string;
  label: string;
  detail: string;
  mark: AuthMark;
}

/**
 * `revealed` steps have completed successfully. If `failed`, the *next*
 * unrevealed step (not a later one) is synthesized as a rejection — the
 * sequence never shows a step succeeding after the point it actually failed.
 */
export function buildAuthLines(revealed: number, failed: boolean): AuthLineView[] {
  // When failed, the last slot is always the rejection line, even if every
  // other step had already been revealed — never silently drop the failure.
  const doneCount = failed
    ? Math.min(Math.max(revealed, 0), AUTH_STEPS.length - 1)
    : Math.min(Math.max(revealed, 0), AUTH_STEPS.length);

  const lines: AuthLineView[] = [];
  for (let i = 0; i < doneCount; i++) {
    const step = AUTH_STEPS[i]!;
    lines.push({ num: String(i + 1).padStart(2, "0"), label: step.label, detail: step.detail, mark: "done" });
  }

  if (failed) {
    lines.push({
      num: String(doneCount + 1).padStart(2, "0"),
      label: "CREDENTIALS REJECTED",
      detail: "USERNAME OR PASSWORD DID NOT MATCH",
      mark: "failed",
    });
  }

  return lines;
}

export function computeAuthPercent(revealed: number, failed: boolean): number {
  const shown = failed
    ? Math.min(revealed + 1, AUTH_STEPS.length)
    : Math.min(Math.max(revealed, 0), AUTH_STEPS.length);
  return Math.round((shown / AUTH_STEPS.length) * 100);
}
