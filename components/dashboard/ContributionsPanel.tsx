import Link from "next/link";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  computeMonthLabels,
  contributionLevel,
  type ContributionResult,
  type ContributionWeek,
} from "@/lib/github/contributions";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };
const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-divider",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/75",
  4: "bg-accent",
};

function yearHref(offset: number): string {
  return offset === 0 ? "/dashboard" : `/dashboard?contribYear=${offset}`;
}

/**
 * The operator's real GitHub contribution calendar (see
 * lib/github/contributions-fetch.ts for why this reads GitHub's own
 * account-wide graph rather than our commit cache). URL-driven year filter
 * (?contribYear=), matching the Link-based filter idiom Fleet/Queue/Source
 * already use — no client JS needed for navigation.
 */
export function ContributionsPanel({
  result,
  yearOffset,
}: {
  result: ContributionResult;
  yearOffset: number;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>GITHUB CONTRIBUTIONS</PanelTitle>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={yearHref(yearOffset + 1)}
            className="font-mono text-[11px] tracking-[0.1em] text-ink-3 hover:text-accent"
            aria-label="Previous year"
          >
            ◂
          </Link>
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
            {yearOffset === 0 ? "LAST 12 MONTHS" : `${yearOffset} YEAR${yearOffset > 1 ? "S" : ""} AGO`}
          </span>
          <Link
            href={yearHref(Math.max(0, yearOffset - 1))}
            aria-disabled={yearOffset === 0}
            className={`font-mono text-[11px] tracking-[0.1em] ${
              yearOffset === 0 ? "pointer-events-none text-ink-disabled" : "text-ink-3 hover:text-accent"
            }`}
            aria-label="Next year"
          >
            ▸
          </Link>
        </div>
      </PanelHeader>

      {result.ok ? (
        <Calendar totalContributions={result.calendar.totalContributions} weeks={result.calendar.weeks} />
      ) : (
        <div className="p-4">
          <EmptyState
            eyebrow={result.notConfigured ? "NOT CONNECTED" : "COULD NOT LOAD"}
            title={result.notConfigured ? "No GitHub connection yet." : "Contributions unavailable."}
            body={result.error}
          />
        </div>
      )}
    </Panel>
  );
}

function Calendar({
  totalContributions,
  weeks,
}: {
  totalContributions: number;
  weeks: ContributionWeek[];
}) {
  const max = weeks.reduce(
    (m, w) => Math.max(m, ...w.contributionDays.map((d) => d.contributionCount)),
    0,
  );
  const monthLabels = computeMonthLabels(weeks);

  return (
    <div className="overflow-x-auto p-4">
      <div className="font-mono text-xs tracking-[0.04em] text-ink-2">
        {totalContributions.toLocaleString()} contributions in this window
      </div>

      <div className="mt-4 inline-grid min-w-full" style={{ gridTemplateColumns: `28px repeat(${weeks.length}, 11px)` }}>
        <div />
        {monthLabels.map(({ weekIndex, label }) => (
          <span
            key={weekIndex}
            className="font-mono text-[9px] tracking-[0.05em] text-ink-faint"
            style={{ gridColumn: weekIndex + 2, gridRow: 1 }}
          >
            {label}
          </span>
        ))}

        {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
          <span
            key={`label-${weekday}`}
            className="font-mono text-[9px] tracking-[0.02em] text-ink-faint"
            style={{ gridColumn: 1, gridRow: weekday + 2 }}
          >
            {WEEKDAY_LABELS[weekday] ?? ""}
          </span>
        ))}

        {weeks.map((week, weekIndex) =>
          week.contributionDays.map((day) => (
            <div
              key={day.date}
              title={`${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"} on ${day.date}`}
              className={`h-[10px] w-[10px] justify-self-center self-center ${LEVEL_CLASS[contributionLevel(day.contributionCount, max)]}`}
              style={{ gridColumn: weekIndex + 2, gridRow: day.weekday + 2 }}
            />
          )),
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] text-ink-faint">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={`h-[10px] w-[10px] ${LEVEL_CLASS[level]}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
