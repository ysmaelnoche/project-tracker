import { ActiveBuilds } from "@/components/dashboard/ActiveBuilds";
import { ContributionsPanel } from "@/components/dashboard/ContributionsPanel";
import { DeployedPanel } from "@/components/dashboard/DeployedPanel";
import { EventLogPanel } from "@/components/dashboard/EventLogPanel";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { MyDayPanel } from "@/components/dashboard/MyDayPanel";
import { PrimaryDirective } from "@/components/dashboard/PrimaryDirective";
import { ReviewQueuePanel } from "@/components/dashboard/ReviewQueuePanel";
import { StandbyPanel } from "@/components/dashboard/StandbyPanel";
import { UpcomingPanel } from "@/components/dashboard/UpcomingPanel";
import { buildDashboardView } from "@/lib/dashboard/build-view";
import { getDashboardData } from "@/lib/dashboard/queries";
import { parseScope } from "@/lib/dashboard/scope";
import { getContributionCalendar } from "@/lib/github/contributions-fetch";

function parseYearOffset(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// PLAN.md "Dashboard" / "Dashboard Overview": the command-center home screen —
// Primary Directive, metrics bar, Active Builds, My Day / Inbound, Standby /
// Deployed, Review Queue, GitHub contributions, Event Log. See the Shipyard
// mockup's `data-screen-label="Overview"` section for the reference layout,
// and `lib/dashboard/build-view.ts` for how every panel's data is derived.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; contribYear?: string }>;
}) {
  const params = await searchParams;
  const scope = parseScope(params.scope);
  const contribYearOffset = parseYearOffset(params.contribYear);
  const today = new Date().toISOString().slice(0, 10);

  const [data, contributions] = await Promise.all([
    getDashboardData(),
    getContributionCalendar(contribYearOffset),
  ]);
  const view = buildDashboardView({ ...data, scope, today });

  return (
    <div className="flex flex-col gap-[clamp(28px,4vw,40px)]">
      {view.directive ? <PrimaryDirective directive={view.directive} /> : null}

      <MetricsBar tiles={view.metrics} />

      <ActiveBuilds cards={view.activeBuilds} />

      <div className="grid grid-cols-1 gap-[clamp(16px,2.5vw,26px)] md:grid-cols-2">
        <MyDayPanel rows={view.myDay} />
        <UpcomingPanel entries={view.upcoming} />
      </div>

      <div className="grid grid-cols-1 gap-[clamp(16px,2.5vw,26px)] md:grid-cols-2">
        <StandbyPanel projects={view.standby} />
        <DeployedPanel projects={view.deployed} />
      </div>

      <ReviewQueuePanel rows={view.reviewQueue} />

      <ContributionsPanel result={contributions} yearOffset={contribYearOffset} />

      {view.eventLog.length > 0 ? <EventLogPanel rows={view.eventLog} /> : null}
    </div>
  );
}
