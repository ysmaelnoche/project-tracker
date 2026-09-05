/** Which way a week-over-week change reads, for coloring the hover tooltip's "vs prior" line. */
export type DeltaTone = "up" | "down" | "flat" | "none";

export interface WeekDelta {
  text: string;
  tone: DeltaTone;
}

/**
 * Formats "this week vs the one before it" as an arrow, a signed count, and
 * a percentage — the percentage is dropped rather than shown as a bogus
 * `Infinity%`/`NaN%` when the prior week was zero. Used by TrendChart's
 * hover tooltip (components/ui/TrendChart.tsx).
 */
export function formatWeekDelta(current: number, previous: number | null): WeekDelta {
  if (previous === null) return { text: "FIRST WEEK ON RECORD", tone: "none" };

  const delta = current - previous;
  if (delta === 0) return { text: "— FLAT", tone: "flat" };

  const pct = previous !== 0 ? ` (${delta > 0 ? "+" : ""}${Math.round((delta / previous) * 100)}%)` : "";
  return delta > 0 ? { text: `▲ +${delta}${pct}`, tone: "up" } : { text: `▼ ${delta}${pct}`, tone: "down" };
}
