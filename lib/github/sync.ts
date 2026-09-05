"use server";

/**
 * `syncRepository` — the one Server Action that talks to GitHub. Everything
 * it decides is delegated to pure functions (`lib/github/shape.ts` for
 * mapping Octokit's raw responses, `lib/github/automations.ts` for what to
 * do with them); this file is intentionally thin I/O glue: fetch, decide,
 * upsert, done. See PLAN.md "GitHub Data Strategy" / "GitHub Failure
 * States" — a GitHub failure here must never break project/task pages, so
 * every GitHub call is wrapped in one try/catch that stores a friendly
 * `last_sync_error` and returns cleanly instead of throwing.
 *
 * NOTE: none of the Octokit calls in `fetchRepositoryData` below have been
 * exercised against a real GitHub API/token in this environment (no
 * `GITHUB_TOKEN`, no live repo here) — see the GitHub slice HANDOFF. The
 * pure decision logic they feed (`buildSyncPlan`) is fully unit-tested.
 */

import type { Octokit } from "@octokit/rest";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getGithubClient } from "@/lib/github/client";
import { toFriendlyGithubError } from "@/lib/github/errors";
import { buildSyncPlan } from "@/lib/github/automations";
import type { FetchedBranch, FetchedCommit, FetchedPullRequest } from "@/lib/github/automations";
import {
  deriveChecksState,
  shapeBranchFromCompare,
  shapeCommit,
  shapePullRequest,
  toBranchRow,
  toCommitRow,
  toPullRequestRow,
} from "@/lib/github/shape";
import type { TaskRefMap } from "@/lib/github/linking";
import { toggleTaskStatus } from "@/lib/tasks/actions";
import { markProduction } from "@/lib/projects/actions";
import { DEFAULT_AUTOMATION_SETTINGS } from "@/lib/types";
import type { AutomationSettings } from "@/lib/types";

export type SyncResult = { ok: true } | { ok: false; error: string };

const MAX_NON_DEFAULT_BRANCHES = 20;
const MAX_PULL_REQUESTS = 20;
const MAX_DEFAULT_BRANCH_COMMITS = 30;

function revalidateGithubSurfaces(projectId: string) {
  revalidatePath("/source");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

async function fetchRepositoryData(octokit: Octokit, owner: string, repo: string) {
  const { data: repoMeta } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoMeta.default_branch;

  const { data: branchList } = await octokit.repos.listBranches({ owner, repo, per_page: 100 });

  const { data: defaultCommitsRaw } = await octokit.repos.listCommits({
    owner,
    repo,
    sha: defaultBranch,
    per_page: MAX_DEFAULT_BRANCH_COMMITS,
  });
  const commits: FetchedCommit[] = defaultCommitsRaw.map((c) => shapeCommit(c, defaultBranch));
  const seenShas = new Set(commits.map((c) => c.sha));

  const branches: FetchedBranch[] = [
    {
      name: defaultBranch,
      aheadBy: 0,
      behindBy: 0,
      lastCommitAt: commits[0]?.authoredAt ?? null,
    },
  ];

  const nonDefaultBranches = branchList.filter((b) => b.name !== defaultBranch).slice(0, MAX_NON_DEFAULT_BRANCHES);
  for (const b of nonDefaultBranches) {
    try {
      const { data: compare } = await octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${defaultBranch}...${b.name}`,
      });
      const shaped = shapeBranchFromCompare(b.name, compare);
      branches.push(shaped.branch);
      for (const c of shaped.commits) {
        if (!seenShas.has(c.sha)) {
          seenShas.add(c.sha);
          commits.push(c);
        }
      }
    } catch {
      // A single branch failing to compare (force-pushed/deleted mid-sync,
      // etc.) shouldn't fail the whole sync — record it with no drift info
      // and move on; the rest of the repository still syncs cleanly.
      branches.push({ name: b.name, aheadBy: 0, behindBy: 0, lastCommitAt: null });
    }
  }

  const { data: prList } = await octokit.pulls.list({
    owner,
    repo,
    state: "all",
    sort: "updated",
    direction: "desc",
    per_page: MAX_PULL_REQUESTS,
  });

  const pullRequests: FetchedPullRequest[] = [];
  for (const prSummary of prList) {
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prSummary.number });

    let hasChangesRequested = false;
    let checksState = null as Awaited<ReturnType<typeof deriveChecksState>> | null;
    const isStillOpen = !pr.merged_at && pr.state !== "closed";
    if (isStillOpen) {
      try {
        const { data: reviews } = await octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pr.number,
          per_page: 20,
        });
        hasChangesRequested = reviews.some((r) => r.state === "CHANGES_REQUESTED");
      } catch {
        // Best-effort — reviewer/checks signals are secondary to the PR existing at all.
      }
      try {
        const { data: checks } = await octokit.checks.listForRef({ owner, repo, ref: pr.head.sha });
        checksState = deriveChecksState(checks.check_runs);
      } catch {
        // Best-effort, see above.
      }
    }

    pullRequests.push(shapePullRequest(pr, { hasChangesRequested }, checksState));
  }

  const { data: tagList } = await octokit.repos.listTags({ owner, repo, per_page: 30 });
  const tags = tagList.map((t) => ({ name: t.name, sha: t.commit.sha }));

  const defaultBranchEntry = branchList.find((b) => b.name === defaultBranch);

  return {
    visibility: (repoMeta.private ? "private" : "public") as "private" | "public",
    defaultBranch,
    defaultBranchHeadSha: defaultBranchEntry?.commit.sha ?? "",
    pushedAt: repoMeta.pushed_at,
    branches,
    commits,
    pullRequests,
    tags,
  };
}

function mapAutomationSettingsRow(row: Record<string, unknown> | null): AutomationSettings {
  if (!row) return DEFAULT_AUTOMATION_SETTINGS;
  return {
    commitLinking: row.commit_linking as boolean,
    branchBinding: row.branch_binding as boolean,
    firstCommitActivatesTask: row.first_commit_activates_task as boolean,
    prMergeClosesTask: row.pr_merge_closes_task as boolean,
    tagMarksProduction: row.tag_marks_production as boolean,
    staleBranchAlert: row.stale_branch_alert as boolean,
    confirmBeforeArchive: row.confirm_before_archive as boolean,
  };
}

/**
 * Fetches recent commits/branches/pull requests for one connected
 * repository, applies task linking + automation rules, upserts the results,
 * and refreshes `repositories.last_synced_at`/`last_push_at`/
 * `last_sync_error`. Safe to call repeatedly (on-demand refresh, no
 * webhooks) — every write is a plain upsert keyed on the schema's existing
 * unique constraints.
 */
export async function syncRepository(repositoryId: string): Promise<SyncResult> {
  const supabase = await createClient();

  const { data: repo, error: repoError } = await supabase
    .from("repositories")
    .select("id, project_id, owner, name, default_branch")
    .eq("id", repositoryId)
    .maybeSingle();

  if (repoError || !repo) {
    return { ok: false, error: "Repository not found." };
  }

  const octokit = await getGithubClient();
  if (!octokit) {
    const message = "GitHub isn't configured. Add a token in Config to enable repository sync.";
    await supabase.from("repositories").update({ last_sync_error: message }).eq("id", repositoryId);
    revalidateGithubSurfaces(repo.project_id);
    return { ok: false, error: message };
  }

  try {
    const [settingsResult, taskRowsResult, existingCommitsResult] = await Promise.all([
      supabase.from("automation_settings").select("*").maybeSingle(),
      supabase.from("tasks").select("id, ref, status, title"),
      supabase.from("gh_commits").select("branch").eq("repository_id", repositoryId),
    ]);

    const settings = mapAutomationSettingsRow(settingsResult.data);
    const tasksByRef: TaskRefMap = new Map(
      (taskRowsResult.data ?? []).map((t) => [t.ref, { id: t.id, status: t.status }]),
    );
    const tasksById = new Map((taskRowsResult.data ?? []).map((t) => [t.id, { title: t.title, ref: t.ref }]));

    const existingBranchCommitCounts: Record<string, number> = {};
    for (const row of existingCommitsResult.data ?? []) {
      if (!row.branch) continue;
      existingBranchCommitCounts[row.branch] = (existingBranchCommitCounts[row.branch] ?? 0) + 1;
    }

    const fetched = await fetchRepositoryData(octokit, repo.owner, repo.name);

    const plan = buildSyncPlan({
      settings,
      tasksByRef,
      commits: fetched.commits,
      branches: fetched.branches,
      pullRequests: fetched.pullRequests,
      existingBranchCommitCounts,
      tags: fetched.tags,
      defaultBranchHeadSha: fetched.defaultBranchHeadSha,
      now: new Date(),
    });

    if (plan.commits.length) {
      const { error } = await supabase
        .from("gh_commits")
        .upsert(
          plan.commits.map((c) => toCommitRow(repositoryId, c)),
          { onConflict: "repository_id,sha" },
        );
      if (error) throw error;
    }
    if (plan.branches.length) {
      const { error } = await supabase
        .from("gh_branches")
        .upsert(
          plan.branches.map((b) => toBranchRow(repositoryId, b)),
          { onConflict: "repository_id,name" },
        );
      if (error) throw error;
    }
    if (plan.pullRequests.length) {
      const { error } = await supabase
        .from("gh_pull_requests")
        .upsert(
          plan.pullRequests.map((p) => toPullRequestRow(repositoryId, p)),
          { onConflict: "repository_id,number" },
        );
      if (error) throw error;
    }

    // first_commit_activates_task: a plain status update, not a reuse of
    // toggleTaskStatus (which only ever toggles between todo/done).
    for (const activation of plan.taskActivations) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", activation.taskId)
        .eq("status", "todo");
      if (error) throw error;

      const task = tasksById.get(activation.taskId);
      await supabase.from("activity_log").insert({
        verb: "TASK ACTIVATED",
        subject: task?.title ?? "Task",
        context_ref: task?.ref ?? null,
        tone: "accent",
      });
    }

    // pr_merge_closes_task: reuse the Tasks slice's own completion action
    // rather than duplicating the done/completed_at transition.
    for (const completion of plan.taskCompletions) {
      await toggleTaskStatus(completion.taskId);
    }

    // tag_marks_production: reuse the Projects slice's own action, which
    // already no-ops when the project is already production/archived.
    if (plan.shouldMarkProduction) {
      await markProduction(repo.project_id);
    }

    await supabase
      .from("repositories")
      .update({
        default_branch: fetched.defaultBranch,
        visibility: fetched.visibility,
        last_synced_at: new Date().toISOString(),
        last_push_at: fetched.pushedAt,
        last_sync_error: null,
      })
      .eq("id", repositoryId);

    revalidateGithubSurfaces(repo.project_id);
    return { ok: true };
  } catch (err) {
    const friendly = toFriendlyGithubError(err);
    await supabase.from("repositories").update({ last_sync_error: friendly }).eq("id", repositoryId);
    revalidateGithubSurfaces(repo.project_id);
    return { ok: false, error: friendly };
  }
}
