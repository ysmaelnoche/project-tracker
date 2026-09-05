"use server";

/**
 * Project Server Actions. Every mutation here is guarded server-side (never
 * trusts a client-supplied date/status) and writes one row to `activity_log`
 * per PLAN.md "Important Business Rules". Tones/verbs match the Shipyard design
 * reference's `log(...)` calls in `askStart`/`askProduction`/`askArchive`/
 * `togglePause`/`submitForm` exactly; `restoreProject` adds a `RESTORED` log
 * entry the reference's `restore()` never wrote (see the deliberate correction
 * noted on `deriveRestoreStatus` in `lib/projects/lifecycle.ts`).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { linkRepository } from "@/lib/github/actions";
import { KEEL_PAYOFF } from "@/lib/projects/create-sequence";
import { deriveEntryStageFields, type EntryStage } from "@/lib/projects/entry-stage";
import { canTogglePause, deriveRestoreStatus } from "@/lib/projects/lifecycle";
import { isValidTargetDate } from "@/lib/projects/target-date";
import type { ActivityTone, Priority, ProjectStatus, ProjectType } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logActivity(
  supabase: SupabaseServerClient,
  verb: string,
  subject: string,
  contextRef: string | null,
  tone: ActivityTone,
) {
  const { error } = await supabase
    .from("activity_log")
    .insert({ verb, subject, context_ref: contextRef, tone });
  if (error) throw new Error(error.message);
}

function revalidateProject(id: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

async function fetchProjectCore(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, ref, name, status, dev_start_date, published_date, archived_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    ref: string;
    name: string;
    status: ProjectStatus;
    dev_start_date: string | null;
    published_date: string | null;
    archived_at: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Creates a project on status "pending" (PLAN.md "Creating a Project") and
 * returns a result for the (client) New Project form's staged "COMMITTING"
 * sequence to react to — see `components/projects/NewProjectForm.tsx`. Never
 * redirects: the caller navigates once it has a result to show first.
 */
export async function createProject(
  formData: FormData,
): Promise<{ ok: true; id: string; repoWarning?: string } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const priority = String(formData.get("priority") ?? "medium") as Priority;
  const targetDate = String(formData.get("targetDate") ?? "").trim();
  const repoSlug = String(formData.get("repoSlug") ?? "").trim();
  const entryStageInput = String(formData.get("entryStage") ?? "pending");

  if (!name) {
    return { ok: false, error: "Name is required." };
  }
  if (type !== "personal" && type !== "work") {
    return { ok: false, error: "Choose a project type." };
  }
  if (
    entryStageInput !== "pending" &&
    entryStageInput !== "in_development" &&
    entryStageInput !== "production"
  ) {
    return { ok: false, error: "Choose an entry stage." };
  }
  const entryStage = entryStageInput as EntryStage;

  // The date field means "target date" for pending/build (must be
  // today-onward — this is a forward-looking ship target, not a fact
  // about the past) but "deploy date" for an already-shipped project,
  // which is deliberately backdatable — see lib/projects/entry-stage.ts.
  if (entryStage !== "production" && !isValidTargetDate(targetDate || null, null, todayIso())) {
    return { ok: false, error: "Target date can't be in the past." };
  }

  const fields = deriveEntryStageFields(entryStage, targetDate || null, todayIso());

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      type: type as ProjectType,
      priority,
      status: fields.status,
      dev_start_date: fields.devStartDate,
      published_date: fields.publishedDate,
      target_date: fields.targetDate,
    })
    .select("id, ref, name")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not create the project. Try again in a moment." };
  }

  await logActivity(supabase, KEEL_PAYOFF[entryStage], data.name, data.ref, "quiet");

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  // Optional "link a repo now" field on the create form. A failed link never
  // undoes the project — it's already created — it's a soft warning the
  // caller surfaces on the project page, ready to retry.
  if (repoSlug) {
    const result = await linkRepository(data.id, repoSlug);
    if (!result.ok) {
      return { ok: true, id: data.id, repoWarning: result.error };
    }
  }

  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------------
// Edit (name / description / priority / target date, and notes separately)
// ---------------------------------------------------------------------------

/** Edits the project's core fields. Deliberately does not touch `type` or `status`. */
export async function updateProject(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium") as Priority;
  const targetDate = String(formData.get("targetDate") ?? "").trim();

  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const supabase = await createClient();

  // An unchanged, already-overdue target date is fine — only a *newly
  // chosen* past date is rejected (see lib/projects/target-date.ts).
  const { data: current } = await supabase
    .from("projects")
    .select("target_date")
    .eq("id", id)
    .maybeSingle();
  if (!isValidTargetDate(targetDate || null, current?.target_date ?? null, todayIso())) {
    return { ok: false, error: "Target date can't be in the past." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ name, description, priority, target_date: targetDate || null })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Could not save those changes." };
  }

  revalidateProject(id);
  return { ok: true };
}

/** Notes get their own small action so the Notes panel can save independently. */
export async function updateNotes(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ notes }).eq("id", id);
  if (error) {
    return { ok: false, error: "Could not save those changes." };
  }

  revalidateProject(id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

/**
 * Called imperatively from the (client) LinksPanel rather than as a plain form
 * action, so it throws on failure instead of redirecting with an error param —
 * the panel shows a toast and keeps its add-link form open to retry.
 */
export async function addProjectLink(projectId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!label || !url) {
    throw new Error("Label and URL are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_links")
    .insert({ project_id: projectId, label, url });
  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectLink(projectId: string, linkId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_links").delete().eq("id", linkId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// Lifecycle transitions (PLAN.md "Project Lifecycle")
// ---------------------------------------------------------------------------

/**
 * Pending -> In Development. Records today's date server-side (never a
 * client-supplied one) and unlocks task creation for this project.
 */
export async function startDevelopment(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (project.status !== "pending") return; // already started; nothing to do

  const { error } = await supabase
    .from("projects")
    .update({ status: "in_development", dev_start_date: todayIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "BUILD INITIATED", project.name, project.ref, "accent");
  revalidateProject(id);
}

/**
 * In Development/Paused -> Production. Preserves tasks/notes/links/GitHub
 * connection untouched — this only changes status and records the publish date.
 */
export async function markProduction(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (project.status === "production" || project.status === "archived") return;

  const { error } = await supabase
    .from("projects")
    .update({ status: "production", published_date: todayIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "DEPLOYED", project.name, project.ref, "teal");
  revalidateProject(id);
}

/** Toggles only between in_development and paused; a no-op for any other status. */
export async function togglePause(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (!canTogglePause(project.status)) return;

  const next: ProjectStatus = project.status === "paused" ? "in_development" : "paused";
  const { error } = await supabase.from("projects").update({ status: next }).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    next === "paused" ? "BUILD HELD" : "BUILD RESUMED",
    project.name,
    project.ref,
    "quiet",
  );
  revalidateProject(id);
}

/**
 * Archives the project. Whether the UI confirms first is decided by the caller
 * (see `getConfirmBeforeArchive` in `lib/projects/queries.ts`) — this action
 * just performs the transition once invoked. Records `archived_at`, which
 * starts the PURGE eligibility clock (lib/projects/purge.ts).
 */
export async function archiveProject(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (project.status === "archived") return;

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "DECOMMISSIONED", project.name, project.ref, "quiet");
  revalidateProject(id);
}

/**
 * Restores an archived project. See `deriveRestoreStatus` for the corrected
 * (vs. the design reference) derivation of which status it returns to.
 * Clears `archived_at` — re-archiving later restarts its PURGE clock.
 */
export async function restoreProject(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (project.status !== "archived") return;

  const nextStatus = deriveRestoreStatus({
    publishedDate: project.published_date,
    devStartDate: project.dev_start_date,
  });

  const { error } = await supabase
    .from("projects")
    .update({ status: nextStatus, archived_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "RESTORED", project.name, project.ref, "quiet");
  revalidateProject(id);
}

// ---------------------------------------------------------------------------
// Scuttle (permanent deletion, operator-confirmed — no waiting period)
// ---------------------------------------------------------------------------

export type ScuttleProjectResult = { ok: true } | { ok: false; error: string };

/**
 * Permanently deletes a project — the one genuinely irreversible action in
 * this app. Reachable either as a decommissioned project's own action, or
 * as an escape hatch straight from an active project (skipping
 * decommissioning entirely) — either way the operator has already been
 * through a real confirmation dialog plus a countdown-with-abort
 * (components/projects/ScuttleSequence.tsx) before this ever runs; there is
 * no eligibility window to re-check here. Deleting the `projects` row
 * cascades to its tasks, notes, links, and its repository row (which itself
 * cascades to gh_commits/gh_branches/gh_pull_requests) — see the
 * `on delete cascade` foreign keys in supabase/migrations/0001_init.sql.
 * This NEVER calls the GitHub API: the repository on GitHub itself is
 * completely untouched, only this app's own record of it goes.
 */
export async function scuttleProject(id: string): Promise<ScuttleProjectResult> {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) return { ok: false, error: "Project not found." };

  // Logged before the delete — the projects row (and the ref this activity
  // entry names) won't exist to look up afterward.
  await logActivity(supabase, "SCUTTLED", project.name, project.ref, "red");

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "Could not delete the project. Try again in a moment." };
  }

  revalidateProject(id);
  revalidatePath("/source");
  return { ok: true };
}
