import { BranchRow } from "@/components/github/BranchRow";
import { CommitRow } from "@/components/github/CommitRow";
import { ConnectRepoForm } from "@/components/github/ConnectRepoForm";
import { DisconnectRepoButton } from "@/components/github/DisconnectRepoButton";
import { PRRow } from "@/components/github/PRRow";
import { RefreshButton } from "@/components/github/RefreshButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { getRepositoryActivity, getRepositoryForProject } from "@/lib/github/queries";
import { sortPullRequestsForFeed } from "@/lib/github/views";

const MAX_ROWS = 5;

/**
 * The per-project GitHub panel (PLAN.md "GitHub Project Development
 * Summary" / "Project Detail Experience"). A GitHub failure never blocks
 * the rest of the project page — this fetches independently and renders an
 * inline warning instead of throwing (see `repository.lastSyncError`).
 */
export async function RepoPanel({ projectId }: { projectId: string }) {
  const repository = await getRepositoryForProject(projectId);

  if (!repository) {
    return (
      <Panel>
        <PanelHeader>
          <PanelTitle>SOURCE</PanelTitle>
        </PanelHeader>
        <div className="p-4">
          <EmptyState
            eyebrow="NOT CONNECTED"
            title="Source — not connected yet."
            body="Connect a GitHub repository to see commits, pushes, pull requests, and development activity here."
            action={<ConnectRepoForm projectId={projectId} />}
          />
        </div>
      </Panel>
    );
  }

  const repoSlug = `${repository.owner}/${repository.name}`;
  const { branches, pullRequests, commits } = await getRepositoryActivity(repository.id);
  const openFirst = sortPullRequestsForFeed(pullRequests).slice(0, MAX_ROWS);
  const recentBranches = branches.slice(0, MAX_ROWS);
  const recentCommits = commits.slice(0, MAX_ROWS);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>SOURCE</PanelTitle>
        <a
          href={`https://github.com/${repoSlug}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[13px] tracking-[0.02em] text-accent hover:text-accent-hover"
        >
          {repoSlug}
        </a>
        <span className="font-mono text-[9px] tracking-[0.13em] text-ink-faint">
          {(repository.visibility ?? "unknown").toUpperCase()} · ⎇ {repository.defaultBranch}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <RefreshButton repositoryId={repository.id} projectId={projectId} />
        </div>
      </PanelHeader>

      {repository.lastSyncError ? (
        <div className="border-b border-divider bg-surface-hover px-4 py-2.5 text-xs leading-relaxed text-red">
          {repository.lastSyncError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-divider px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
        <span>
          LAST PUSH{" "}
          {repository.lastPushAt ? new Date(repository.lastPushAt).toISOString().slice(0, 16).replace("T", " ") : "—"}
        </span>
        <span>
          LAST SYNCED{" "}
          {repository.lastSyncedAt
            ? new Date(repository.lastSyncedAt).toISOString().slice(0, 16).replace("T", " ")
            : "NEVER"}
        </span>
      </div>

      <div className="border-b border-divider px-4 py-2.5">
        <div className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">PULL REQUESTS</div>
        {openFirst.length === 0 ? (
          <div className="py-3 text-xs text-ink-3">No pull requests on record.</div>
        ) : (
          <div className="-mx-4 mt-1">
            {openFirst.map((pr) => (
              <PRRow key={pr.id} pr={pr} repoSlug={repoSlug} />
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-divider px-4 py-2.5">
        <div className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">BRANCHES</div>
        {recentBranches.length === 0 ? (
          <div className="py-3 text-xs text-ink-3">No branches on record.</div>
        ) : (
          <div className="-mx-4 mt-1">
            {recentBranches.map((b) => (
              <BranchRow key={b.id} branch={b} repoSlug={repoSlug} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5">
        <div className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">RECENT COMMITS</div>
        {recentCommits.length === 0 ? (
          <div className="py-3 text-xs text-ink-3">No commits on record.</div>
        ) : (
          <div className="-mx-4 mt-1">
            {recentCommits.map((c) => (
              <CommitRow key={c.id} commit={c} repoSlug={repoSlug} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-divider px-4 py-2.5 text-right">
        <DisconnectRepoButton repositoryId={repository.id} projectId={projectId} repoSlug={repoSlug} />
      </div>
    </Panel>
  );
}
