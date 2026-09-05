import "server-only";

/**
 * Tiny, self-contained reads that feed the command palette's search index.
 * Deliberately not a shared "projects/tasks service" — selects only the
 * columns the palette needs (see task brief: "your palette's project/task
 * search just does its own tiny direct read of projects/tasks, no
 * dependency on their code").
 */

import { createClient } from "@/lib/supabase/server";
import type { PaletteProjectInput, PaletteTaskInput } from "@/lib/palette/entries";

/** Every non-archived project (archived projects aren't useful jump targets). */
export async function listPaletteProjects(): Promise<PaletteProjectInput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, ref, name, status")
    .neq("status", "archived")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Every open (not-done) task, project or standalone. */
export async function listPaletteTasks(): Promise<PaletteTaskInput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, ref, title, project_id, status")
    .neq("status", "done")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    ref: row.ref,
    title: row.title,
    projectId: row.project_id,
    status: row.status,
  }));
}
