/**
 * Small, self-contained, READ-ONLY reads against `tasks` for progress counts,
 * the stage strip, and the "Next" indicator.
 *
 * The Tasks slice owns `lib/tasks/*` (creation, completion, deletion, the Queue
 * screen). This file intentionally does not duplicate that data-access layer —
 * it only selects the handful of columns the Projects slice needs to compute
 * progress/next-task, right where those are used.
 */

import { createClient } from "@/lib/supabase/server";
import type { Priority, TaskStatus } from "@/lib/types";

export interface ProjectTaskRow {
  id: string;
  ref: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
}

interface TaskRow {
  id: string;
  ref: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
}

const TASK_COLUMNS = "id, ref, project_id, title, status, priority, due_date, created_at";

function mapTaskRow(row: TaskRow): ProjectTaskRow {
  return {
    id: row.id,
    ref: row.ref,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

/** All tasks for one project, oldest first (a stable, readable default order). */
export async function listTasksForProject(projectId: string): Promise<ProjectTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as TaskRow[]).map(mapTaskRow);
}

/**
 * Tasks for many projects in one round trip (avoids an N+1 when rendering the
 * Fleet list), grouped by project id.
 */
export async function listTasksForProjects(
  projectIds: string[],
): Promise<Map<string, ProjectTaskRow[]>> {
  const map = new Map<string, ProjectTaskRow[]>();
  if (projectIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .in("project_id", projectIds);

  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as TaskRow[]) {
    const existing = map.get(row.project_id) ?? [];
    existing.push(mapTaskRow(row));
    map.set(row.project_id, existing);
  }
  return map;
}
