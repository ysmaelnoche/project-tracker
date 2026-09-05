import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectLite } from "@/lib/tasks/present";
import type { Task } from "@/lib/types";

interface TaskRow {
  id: string;
  ref: string;
  project_id: string | null;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const TASK_COLUMNS =
  "id, ref, project_id, title, description, status, priority, due_date, due_time, completed_at, created_at, updated_at";

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    ref: row.ref,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    dueTime: row.due_time,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Every task belonging to the current user (RLS scopes this to `auth.uid()`),
 * newest first. View/context bucketing happens in `lib/tasks/views.ts` on the
 * result — this is a plain read, no filtering logic lives here.
 */
export async function listTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTaskRow);
}

/**
 * A lightweight, read-only projects list for the Tasks slice: the New Task
 * form's project picker, and joining a task's `project_id` to a display ref/
 * name/type. Deliberately not a shared "projects service" — the Projects
 * slice owns full project CRUD elsewhere (see task brief).
 */
export async function listProjectsLite(): Promise<ProjectLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, ref, name, type, status")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
