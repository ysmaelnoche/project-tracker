"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { toFriendlyTaskError } from "@/lib/tasks/errors";
import type { Priority } from "@/lib/types";

export type TaskActionResult = { ok: true } | { ok: false; error: string };

function revalidateTaskSurfaces(projectId: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

async function logTaskActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  verb: string,
  subject: string,
  projectId: string | null,
  tone: "teal" | "accent" | "quiet",
) {
  let contextRef = "STANDALONE";
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("ref")
      .eq("id", projectId)
      .maybeSingle();
    contextRef = project?.ref ?? "STANDALONE";
  }
  await supabase.from("activity_log").insert({
    verb,
    subject,
    context_ref: contextRef,
    tone,
  });
}

export interface CreateTaskInput {
  title: string;
  projectId: string | null;
  priority: Priority;
  dueDate: string | null;
}

/**
 * Creates a project task or a standalone personal task (projectId null).
 * The New Task form already disables pending projects in the picker
 * (PLAN.md "Project Task Business Rule") — this still handles the DB
 * trigger rejecting the insert if a stale form slips one through, surfacing
 * a clean message instead of the raw Postgres exception.
 */
export async function createTask(input: CreateTaskInput): Promise<TaskActionResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the task a title." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title,
      priority: input.priority,
      due_date: input.dueDate || null,
    })
    .select("project_id")
    .single();

  if (error || !data) {
    return { ok: false, error: toFriendlyTaskError(error) };
  }

  await logTaskActivity(supabase, "TASK CREATED", title, data.project_id, "quiet");
  revalidateTaskSurfaces(data.project_id);

  return { ok: true };
}

/**
 * Toggles a task between open and done. Completing sets `completed_at` to
 * now; reopening clears it — both server-side, matching PLAN.md "Task
 * Completion". Logs `TASK COMPLETE` / `TASK REOPENED` to the activity feed.
 */
export async function toggleTaskStatus(id: string): Promise<TaskActionResult & { done?: boolean }> {
  const supabase = await createClient();
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, project_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !task) {
    return { ok: false, error: "That task couldn't be found." };
  }

  const willBeDone = task.status !== "done";
  const { error } = await supabase
    .from("tasks")
    .update({
      status: willBeDone ? "done" : "todo",
      completed_at: willBeDone ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: toFriendlyTaskError(error) };
  }

  await logTaskActivity(
    supabase,
    willBeDone ? "TASK COMPLETE" : "TASK REOPENED",
    task.title,
    task.project_id,
    willBeDone ? "teal" : "accent",
  );
  revalidateTaskSurfaces(task.project_id);

  return { ok: true, done: willBeDone };
}

/**
 * Hard-deletes a task (standalone or project task) — unlike projects, tasks
 * are not archived, they're gone (PLAN.md scopes archive-not-delete to
 * projects only). No activity log entry: the reference's `confirmDelete`
 * only shows a toast, it doesn't write a log event for deletion.
 */
export async function deleteTask(id: string): Promise<TaskActionResult> {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("project_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return { ok: false, error: toFriendlyTaskError(error) };
  }

  revalidateTaskSurfaces(task?.project_id ?? null);

  return { ok: true };
}
