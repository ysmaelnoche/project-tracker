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
import { canTogglePause, deriveRestoreStatus } from "@/lib/projects/lifecycle";
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
    .select("id, ref, name, status, dev_start_date, published_date")
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

  if (!name) {
    return { ok: false, error: "Name is required." };
  }
  if (type !== "personal" && type !== "work") {
    return { ok: false, error: "Choose a project type." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      type: type as ProjectType,
      priority,
      target_date: targetDate || null,
    })
    .select("id, ref, name")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not create the project. Try again in a moment." };
  }

  await logActivity(supabase, "KEEL LAID", data.name, data.ref, "quiet");

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
 * just performs the transition once invoked.
 */
export async function archiveProject(id: string) {
  const supabase = await createClient();
  const project = await fetchProjectCore(supabase, id);
  if (!project) throw new Error("Project not found.");
  if (project.status === "archived") return;

  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "DECOMMISSIONED", project.name, project.ref, "quiet");
  revalidateProject(id);
}

/**
 * Restores an archived project. See `deriveRestoreStatus` for the corrected
 * (vs. the design reference) derivation of which status it returns to.
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

  const { error } = await supabase.from("projects").update({ status: nextStatus }).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity(supabase, "RESTORED", project.name, project.ref, "quiet");
  revalidateProject(id);
}
