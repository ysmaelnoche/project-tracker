import Link from "next/link";
import { BranchRow } from "@/components/github/BranchRow";
import { CommitRow } from "@/components/github/CommitRow";
import { DisconnectRepoButton } from "@/components/github/DisconnectRepoButton";
import { PRRow } from "@/components/github/PRRow";
import { UnlinkedProjectRow } from "@/components/github/UnlinkedProjectRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { pad2 } from "@/lib/format";
import { getSourceOverview } from "@/lib/github/queries";
import {
  SOURCE_TAB_DEFS,
  buildSourceTabHref,
  computeSourceMetrics,
  parseSourceTab,
  sortPullRequestsForFeed,
} from "@/lib/github/views";
import { getTodayIso } from "@/lib/timezone-server";

interface MetricDef {
  key: "linkedRepos" | "openPRs" | "awaitingReview" | "failingChecks" | "pushedToday" | "staleBranches";
  label: string;
  unit: string;
  alertWhenPositive?: boolean;
}

const METRIC_DEFS: MetricDef[] = [
  { key: "linkedRepos", label: "LINKED REPOS", unit: "REPOS" },
  { key: "openPRs", label: "OPEN PRS", unit: "IN FLIGHT" },
  { key: "awaitingReview", label: "AWAITING REVIEW", unit: "PRS", alertWhenPositive: true },
  { key: "failingChecks", label: "CHECKS FAILING", unit: "PRS", alertWhenPositive: true },
  { key: "pushedToday", label: "PUSHED TODAY", unit: "COMMITS" },
  { key: "staleBranches", label: "STALE BRANCHES", unit: "14D+ IDLE", alertWhenPositive: true },
];

/**
 * Cross-project Source Control screen (PLAN.md "GitHub Integration" / "GitHub
 * Empty State"): a metrics strip, the repository list (with an affordance to
 * connect any project that doesn't have one yet), and a tabbed feed of every
 * pull request / branch / commit across every connected repository.
 */
export default async function SourcePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = parseSourceTab(tabParam);

  const overview = await getSourceOverview();
  const today = await getTodayIso();

  const metrics = computeSourceMetrics({
    repoCount: overview.repositories.length,
    liveProjectCount: overview.liveProjectCount,
    pullRequests: overview.pullRequests,
    commits: overview.commits,
    branches: overview.branches,
    today,
  });

  const hasRepos = overview.repositories.length > 0;
  const feedPRs = sortPullRequestsForFeed(overview.pullRequests);
  const repoSlugById = new Map(overview.repositories.map((r) => [r.id, `${r.owner}/${r.name}`]));

  const tabCounts: Record<(typeof SOURCE_TAB_DEFS)[number]["key"], number> = {
    prs: overview.pullRequests.length,
    branches: overview.branches.length,
    commits: overview.commits.length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="m-0 font-mono text-[clamp(24px,3.4vw,32px)] font-light leading-[1.1] tracking-[0.02em] text-ink">
          SOURCE CONTROL
        </h1>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          READ-ONLY MIRROR OF GITHUB
        </span>
      </div>

      {/* Grid lines drawn via a 1px gap over the divider color, not per-cell
          borders — a `last:border-r-0` right-border only ever strips the
          DOM's last cell, which is correct for one row (the lg: 6-col layout)
          but wrong for every row above the last at 2 or 3 columns (mobile/
          tablet): the real rightmost cell of each earlier row still got a
          right border, doubled against the grid's own gap line. The gap
          trick draws exactly one line between cells at any column count. */}
      <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-divider sm:grid-cols-3 lg:grid-cols-6">
        {METRIC_DEFS.map((m) => {
          const value = metrics[m.key];
          const alert = !!m.alertWhenPositive && value > 0;
          return (
            <div key={m.key} className="bg-surface p-4">
              <div className="font-mono text-[9px] tracking-[0.15em] text-ink-faint">{m.label}</div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-[clamp(20px,2.6vw,26px)] font-light tracking-[-0.03em] tabular-nums ${
                    alert ? "text-red" : "text-ink"
                  }`}
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] tracking-[0.1em] text-ink-faint">{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="mt-6">
        <PanelHeader>
          <PanelTitle>REPOSITORIES</PanelTitle>
        </PanelHeader>

        {hasRepos ? (
          <div>
            {overview.repositories.map((repo) => (
              <div
                key={repo.id}
                className="border-b border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-hover"
              >
                <Link href={`/projects/${repo.projectId}`} className="block">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{repo.projectRef}</span>
                    <span className="font-mono text-[13px] tracking-[0.03em] text-accent">
                      github.com/{repo.owner}/{repo.name}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.13em] text-ink-faint">
                      {(repo.visibility ?? "unknown").toUpperCase()} · ⎇ {repo.defaultBranch}
                    </span>
                    <span
                      className={`ml-auto font-mono text-[9px] tracking-[0.12em] ${
                        repo.openPrCount ? "text-accent" : "text-ink-faint"
                      }`}
                    >
                      LAST PUSH{" "}
                      {repo.lastPushAt ? repo.lastPushAt.slice(0, 16).replace("T", " ") : "—"} ·{" "}
                      {pad2(repo.branchCount)} BRANCHES · {pad2(repo.openPrCount)} OPEN PR
                    </span>
                  </div>
                  {repo.lastSyncError ? (
                    <div className="mt-1.5 text-xs text-red">{repo.lastSyncError}</div>
                  ) : null}
                </Link>
                <div className="mt-2 text-right">
                  <DisconnectRepoButton
                    repositoryId={repo.id}
                    projectId={repo.projectId}
                    repoSlug={`${repo.owner}/${repo.name}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              eyebrow="NO REPOSITORIES LINKED"
              title="Nothing is wired up yet."
              body="Connect a GitHub repository to see commits, pushes, pull requests, and development activity here."
            />
          </div>
        )}

        {overview.unlinkedProjects.length > 0 ? (
          <div className="bg-track">
            <div className="px-4 pt-3 font-mono text-[9px] tracking-[0.14em] text-ink-faint">
              PROJECTS WITHOUT A REPOSITORY
            </div>
            {overview.unlinkedProjects.map((p) => (
              <UnlinkedProjectRow key={p.id} id={p.id} projectRef={p.ref} name={p.name} />
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel className="mt-6">
        <PanelHeader>
          {SOURCE_TAB_DEFS.map((t) => (
            <Link
              key={t.key}
              href={buildSourceTabHref(t.key)}
              className={`font-mono text-[10px] tracking-[0.16em] ${
                tab === t.key ? "text-accent" : "text-ink-3 hover:text-ink"
              }`}
            >
              {t.label} <span className="text-ink-faint">{pad2(tabCounts[t.key])}</span>
            </Link>
          ))}
        </PanelHeader>

        {tab === "prs" ? (
          feedPRs.length === 0 ? (
            <div className="p-6 text-sm text-ink-3">No pull requests on record.</div>
          ) : (
            <div>
              {feedPRs.map((pr) => (
                <PRRow
                  key={pr.id}
                  pr={pr}
                  repoSlug={repoSlugById.get(pr.repositoryId) ?? ""}
                  projectRef={pr.projectRef}
                />
              ))}
            </div>
          )
        ) : null}

        {tab === "branches" ? (
          overview.branches.length === 0 ? (
            <div className="p-6 text-sm text-ink-3">No branches on record.</div>
          ) : (
            <div>
              {overview.branches.map((b) => (
                <BranchRow
                  key={b.id}
                  branch={b}
                  repoSlug={repoSlugById.get(b.repositoryId) ?? ""}
                  projectRef={b.projectRef}
                />
              ))}
            </div>
          )
        ) : null}

        {tab === "commits" ? (
          overview.commits.length === 0 ? (
            <div className="p-6 text-sm text-ink-3">No commits on record.</div>
          ) : (
            <div>
              {overview.commits.map((c) => (
                <CommitRow
                  key={c.id}
                  commit={c}
                  repoSlug={repoSlugById.get(c.repositoryId) ?? ""}
                  projectRef={c.projectRef}
                />
              ))}
            </div>
          )
        ) : null}
      </Panel>
    </div>
  );
}
