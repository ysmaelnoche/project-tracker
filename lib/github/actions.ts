"use server";

/**
 * GitHub Server Actions: connect/disconnect a repository, trigger an
 * on-demand refresh, toggle one automation setting, and sign out. Every
 * mutation here follows the same "never throw a raw error at the UI" rule
 * as `lib/projects/actions.ts`/`lib/tasks/actions.ts` — GitHub-specific
 * failures are mapped through `toFriendlyGithubError`.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getGithubClient } from "@/lib/github/client";
import { toFriendlyGithubError } from "@/lib/github/errors";
import { syncRepository } from "@/lib/github/sync";
import { DEFAULT_AUTOMATION_SETTINGS } from "@/lib/types";
import type { AutomationSettings } from "@/lib/types";

export type GithubActionResult = { ok: true } | { ok: false; error: string };

function revalidateGithubSurfaces(projectId: string) {
  revalidatePath("/source");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

const SLUG_PATTERN = /^([\w.-]+)\/([\w.-]+)$/;

/**
 * Connects a repository to a project: validates `owner/name` resolves via
 * Octokit (repo metadata: default branch, visibility), inserts the
 * `repositories` row, then triggers the initial sync so the project page
 * isn't left with an empty panel until the next manual refresh.
 */
export async function connectRepository(
  projectId: string,
  formData: FormData,
): Promise<GithubActionResult> {
  const slug = String(formData.get("slug") ?? "").trim();
  const match = slug.match(SLUG_PATTERN);
  if (!match) {
    return { ok: false, error: "Enter a repository as owner/name — e.g. me/my-project." };
  }
  const owner = match[1];
  const name = match[2];
  if (!owner || !name) {
    return { ok: false, error: "Enter a repository as owner/name — e.g. me/my-project." };
  }

  const octokit = getGithubClient();
  if (!octokit) {
    return { ok: false, error: "GitHub isn't configured. Add a GITHUB_TOKEN to enable this." };
  }

  let meta: { default_branch: string; private: boolean };
  try {
    const { data } = await octokit.repos.get({ owner, repo: name });
    meta = data;
  } catch (err) {
    return { ok: false, error: toFriendlyGithubError(err) };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("repositories")
    .insert({
      project_id: projectId,
      owner,
      name,
      default_branch: meta.default_branch,
      visibility: meta.private ? "private" : "public",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    const alreadyConnected = error?.code === "23505"; // unique violation on repositories.project_id
    return {
      ok: false,
      error: alreadyConnected
        ? "This project already has a connected repository. Disconnect it first to link a different one."
        : "Could not save the repository connection.",
    };
  }

  const { data: project } = await supabase.from("projects").select("ref").eq("id", projectId).maybeSingle();
  await supabase.from("activity_log").insert({
    verb: "REPOSITORY LINKED",
    subject: `${owner}/${name}`,
    context_ref: project?.ref ?? null,
    tone: "amber",
  });

  revalidateGithubSurfaces(projectId);

  // Best-effort initial backfill — a failure here doesn't undo the
  // connection, it just leaves `last_sync_error` set for the next refresh.
  await syncRepository(inserted.id);
  revalidateGithubSurfaces(projectId);

  return { ok: true };
}

/** Disconnects a repository. Cascades to its branches/PRs/commits (schema `on delete cascade`). */
export async function disconnectRepository(
  repositoryId: string,
  projectId: string,
): Promise<GithubActionResult> {
  const supabase = await createClient();

  const [{ data: repo }, { data: project }] = await Promise.all([
    supabase.from("repositories").select("owner, name").eq("id", repositoryId).maybeSingle(),
    supabase.from("projects").select("ref").eq("id", projectId).maybeSingle(),
  ]);

  const { error } = await supabase.from("repositories").delete().eq("id", repositoryId);
  if (error) return { ok: false, error: "Could not disconnect the repository." };

  await supabase.from("activity_log").insert({
    verb: "REPOSITORY UNLINKED",
    subject: repo ? `${repo.owner}/${repo.name}` : "Repository",
    context_ref: project?.ref ?? null,
    tone: "quiet",
  });

  revalidateGithubSurfaces(projectId);
  return { ok: true };
}

/** Manual on-demand refresh — the entire "sync strategy" for this integration. */
export async function refreshRepository(
  repositoryId: string,
  projectId: string,
): Promise<GithubActionResult> {
  const result = await syncRepository(repositoryId);
  revalidateGithubSurfaces(projectId);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

const AUTOMATION_COLUMNS = {
  commitLinking: "commit_linking",
  branchBinding: "branch_binding",
  firstCommitActivatesTask: "first_commit_activates_task",
  prMergeClosesTask: "pr_merge_closes_task",
  tagMarksProduction: "tag_marks_production",
  staleBranchAlert: "stale_branch_alert",
  confirmBeforeArchive: "confirm_before_archive",
} as const;

export type AutomationSettingKey = keyof typeof AUTOMATION_COLUMNS;

/**
 * Flips one automation-settings boolean. Upserts so the first toggle a user
 * ever makes creates their `automation_settings` row (every other column
 * falls back to its DB default — see `supabase/migrations/0001_init.sql`).
 */
export async function toggleAutomationSetting(key: AutomationSettingKey): Promise<GithubActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const { data: currentRow } = await supabase
    .from("automation_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const current: AutomationSettings = currentRow
    ? {
        commitLinking: currentRow.commit_linking,
        branchBinding: currentRow.branch_binding,
        firstCommitActivatesTask: currentRow.first_commit_activates_task,
        prMergeClosesTask: currentRow.pr_merge_closes_task,
        tagMarksProduction: currentRow.tag_marks_production,
        staleBranchAlert: currentRow.stale_branch_alert,
        confirmBeforeArchive: currentRow.confirm_before_archive,
      }
    : DEFAULT_AUTOMATION_SETTINGS;

  const column = AUTOMATION_COLUMNS[key];
  const next = !current[key];

  const { error } = await supabase
    .from("automation_settings")
    .upsert({ user_id: user.id, [column]: next }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "Could not save that setting." };

  revalidatePath("/settings");
  return { ok: true };
}

/** Signs the operator out and returns them to the access screen. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/access");
}
