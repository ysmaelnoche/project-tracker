/**
 * "Lay a keel" doesn't have to mean starting from zero — a project can be
 * registered already mid-build or already shipped (importing something
 * that existed before this tracker did). `EntryStage` is the three states
 * a project can be registered *at*; picking one decides which fields get
 * stamped on creation, all from this one pure function so
 * `lib/projects/actions.ts`'s `createProject` stays a thin, declarative
 * caller. Deliberately never invents a historical date it doesn't
 * actually know (e.g. "when did the already-deployed project first start
 * development?") — only `targetDate`, the operator's own input, is ever
 * carried through unset.
 */

export type EntryStage = "pending" | "in_development" | "production";

export interface EntryStageFields {
  status: EntryStage;
  devStartDate: string | null;
  publishedDate: string | null;
  targetDate: string | null;
}

export function deriveEntryStageFields(
  entryStage: EntryStage,
  targetDate: string | null,
  todayIso: string,
): EntryStageFields {
  if (entryStage === "in_development") {
    return { status: "in_development", devStartDate: todayIso, publishedDate: null, targetDate };
  }
  if (entryStage === "production") {
    // No target date once it's already shipped, and no fabricated build
    // start — we only know it's live now, not when development began.
    return { status: "production", devStartDate: null, publishedDate: todayIso, targetDate: null };
  }
  return { status: "pending", devStartDate: null, publishedDate: null, targetDate };
}
