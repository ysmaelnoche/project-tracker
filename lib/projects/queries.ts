/**
 * Read-only project data access. Uses the anon-key server client — RLS already
 * scopes every row to auth.uid(), so no service-role client is needed here.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  ActivityTone,
  Priority,
  Project,
  ProjectLink,
  ProjectStatus,
  ProjectType,
} from "@/lib/types";

interface ProjectRow {
  id: string;
  ref: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  dev_start_date: string | null;
  target_date: string | null;
  published_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface LinkRow {
  id: string;
  project_id: string;
  label: string;
  url: string;
}

function mapLink(row: LinkRow): ProjectLink {
  return { id: row.id, label: row.label, url: row.url };
}

function mapProject(row: ProjectRow, links: ProjectLink[]): Project {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    description: row.description,
    type: row.type,
    status: row.status,
    priority: row.priority,
    devStartDate: row.dev_start_date,
    targetDate: row.target_date,
    publishedDate: row.published_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links,
  };
}

/** Every project owned by the signed-in user, newest first. */
export async function listProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const [projectsResult, linksResult] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_links").select("*"),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (linksResult.error) throw new Error(linksResult.error.message);

  const linksByProject = new Map<string, ProjectLink[]>();
  for (const row of (linksResult.data ?? []) as LinkRow[]) {
    const existing = linksByProject.get(row.project_id) ?? [];
    existing.push(mapLink(row));
    linksByProject.set(row.project_id, existing);
  }

  return ((projectsResult.data ?? []) as ProjectRow[]).map((row) =>
    mapProject(row, linksByProject.get(row.id) ?? []),
  );
}

/** A single project by id, or null if it doesn't exist / isn't owned by the caller. */
export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: linkRows, error: linksError } = await supabase
    .from("project_links")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (linksError) throw new Error(linksError.message);

  return mapProject(row as ProjectRow, ((linkRows ?? []) as LinkRow[]).map(mapLink));
}

/**
 * Whether archiving should be confirmed before it happens (PLAN.md "Archived
 * Projects" / settings toggle). Defaults to `true` (confirm) when signed out,
 * on a query error, or when the user has no `automation_settings` row yet —
 * this is a personal-safety default, never a hard failure.
 */
export async function getConfirmBeforeArchive(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true;

  const { data, error } = await supabase
    .from("automation_settings")
    .select("confirm_before_archive")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return true;
  return data.confirm_before_archive ?? true;
}

interface ActivityRow {
  id: string;
  verb: string;
  subject: string;
  context_ref: string | null;
  tone: ActivityTone;
  created_at: string;
}

/**
 * Recent activity scoped to one project (matched by its `ref`, which every
 * project-related mutation in `lib/projects/actions.ts` writes as `context_ref`).
 */
export async function listActivityForProject(ref: string, limit = 6): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("context_ref", ref)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as ActivityRow[]).map((row) => ({
    id: row.id,
    verb: row.verb,
    subject: row.subject,
    contextRef: row.context_ref,
    tone: row.tone,
    createdAt: row.created_at,
  }));
}
