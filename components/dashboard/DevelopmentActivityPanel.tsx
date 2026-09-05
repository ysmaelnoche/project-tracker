import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendChart } from "@/components/ui/TrendChart";
import type { DevelopmentActivity } from "@/lib/github/dev-activity-fetch";

/**
 * Real commit/PR activity across every connected repo (private repos
 * included), replacing an earlier attempt at a GitHub-style contribution
 * calendar — that used GitHub's account-wide GraphQL API, which structurally
 * cannot see private repository activity for any token. This panel only
 * ever shows real, verifiable data from lib/github/dev-activity-fetch.ts.
 */
export function DevelopmentActivityPanel({
  activity,
  today,
}: {
  activity: DevelopmentActivity;
  today: string;
}) {
  if (!activity.hasAnyRepo) {
    return (
      <Panel>
        <PanelHeader>
          <PanelTitle>DEVELOPMENT ACTIVITY</PanelTitle>
        </PanelHeader>
        <div className="p-4">
          <EmptyState
            eyebrow="NOT CONNECTED"
            title="No repositories connected yet."
            body="Connect a GitHub repository to a project to see commits and pull requests here."
          />
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>DEVELOPMENT ACTIVITY</PanelTitle>
        <span className="ml-auto font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          LAST 12 WEEKS
        </span>
      </PanelHeader>

      <div className="p-4">
        <TrendChart commits={activity.trend.commits} merges={activity.trend.merges} todayIso={today} />

        {activity.repoBreakdown.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2 border-t border-divider pt-4">
            {activity.repoBreakdown.slice(0, 6).map((repo) => (
              <div key={repo.projectRef} className="flex items-baseline gap-3">
                <span className="flex-none font-mono text-[9px] tracking-[0.14em] text-ink-faint">
                  {repo.projectRef}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] tracking-[0.03em] text-ink">
                  {repo.projectName.toUpperCase()}
                </span>
                <span className="flex-none font-mono text-[10px] tracking-[0.08em] text-ink-3">
                  {repo.commitCount} COMMIT{repo.commitCount === 1 ? "" : "S"}
                </span>
                {repo.openPrCount > 0 ? (
                  <span className="flex-none font-mono text-[10px] tracking-[0.08em] text-accent">
                    {repo.openPrCount} OPEN PR{repo.openPrCount === 1 ? "" : "S"}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 border-t border-divider pt-4 text-sm leading-relaxed text-ink-3">
            No commits synced yet for your connected repos — hit Refresh on a project&apos;s Source panel.
          </p>
        )}
      </div>
    </Panel>
  );
}
