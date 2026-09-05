/**
 * "Lay a keel" doesn't have to mean starting from zero — a project can be
 * registered already mid-build or already shipped (importing something
 * that existed before this tracker did). `EntryStage` is the three states
 * a project can be registered *at*; picking one decides which fields get
 * stamped on creation, all from this one pure function so
 * `lib/projects/actions.ts`'s `createProject` stays a thin, declarative
 * caller.
 *
 * The single `dateInput` param is deliberately overloaded — it's the same
 * form field, repurposed by the UI (NewProjectForm) to mean whatever makes
 * sense for the chosen stage: a forward-looking target ship date for
 * PENDING/BUILD, or the date it actually deployed for DEPLOYED (optional,
 * defaults to today if left blank). Never invents a historical date it
 * doesn't actually know — DEPLOYED never fabricates a build-start date,
 * since all this function knows is that it's live now.
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
  dateInput: string | null,
  todayIso: string,
): EntryStageFields {
  if (entryStage === "in_development") {
    return { status: "in_development", devStartDate: todayIso, publishedDate: null, targetDate: dateInput };
  }
  if (entryStage === "production") {
    // dateInput here means "when did this actually deploy" — optional,
    // defaulting to today rather than requiring an exact historical date.
    return { status: "production", devStartDate: null, publishedDate: dateInput ?? todayIso, targetDate: null };
  }
  return { status: "pending", devStartDate: null, publishedDate: null, targetDate: dateInput };
}
