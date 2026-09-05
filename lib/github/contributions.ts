/**
 * Pure view/derivation logic for the GitHub contribution calendar — no
 * "server-only" here (unlike lib/github/contributions-fetch.ts) so it stays
 * trivially unit-testable without a database or a GitHub call.
 */

export interface ContributionDay {
  date: string;
  weekday: number;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export type ContributionResult =
  | { ok: true; calendar: ContributionCalendar }
  | { ok: false; error: string; notConfigured?: boolean };

/** 0 for no activity; otherwise 1 (least) to 4 (most), scaled against the
 * busiest day in the same window — same idea as GitHub's own graph, just a
 * simpler relative scale rather than reproducing their exact quartiles. */
export function contributionLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const level = Math.floor((count / max) * 4) + 1;
  return Math.min(4, level) as 1 | 2 | 3 | 4;
}

export function totalForWindow(weeks: ContributionWeek[]): number {
  return weeks.reduce(
    (sum, week) => sum + week.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
    0,
  );
}

/** The one-year window ending on `referenceIsoDate`, shifted back `offsetYears`
 * full years — offset 0 is "the last 12 months" (GitHub's own default view),
 * offset 1 is the 12 months before that, and so on. */
export function buildYearWindow(
  referenceIsoDate: string,
  offsetYears: number,
): { from: string; to: string } {
  const parts = referenceIsoDate.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;

  const to = new Date(Date.UTC(year - offsetYears, month - 1, day, 23, 59, 59, 999));
  const from = new Date(Date.UTC(year - offsetYears - 1, month - 1, day + 1, 0, 0, 0, 0));
  return { from: from.toISOString(), to: to.toISOString() };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export interface MonthLabel {
  weekIndex: number;
  label: string;
}

/** Where to place a month name above the calendar grid — one label per week
 * whose first day starts a new month, so labels never repeat back to back. */
export function computeMonthLabels(weeks: ContributionWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;

    const month = Number(firstDay.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      labels.push({ weekIndex, label: MONTH_NAMES[month] ?? "" });
      lastMonth = month;
    }
  });

  return labels;
}
