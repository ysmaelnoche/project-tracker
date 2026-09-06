import type { MetricTile, MetricTone } from "@/lib/dashboard/metrics";

const TONE_CLASS: Record<MetricTone, string> = {
  ink: "text-ink",
  accent: "text-accent",
  teal: "text-teal",
  red: "text-red",
};

/** The Overview's six-tile metrics strip (PLAN.md "Dashboard Overview"). */
export function MetricsBar({ tiles }: { tiles: MetricTile[] }) {
  return (
    // Grid lines via a 1px gap over the divider color, not a per-cell
    // `border-r` — this is an `auto-fit` grid, so how many tiles land in a
    // row (and which one ends up rightmost) changes with viewport width;
    // a static border-r doubles against the container's own edge on
    // whichever tile is currently last in its row, and gave no separation
    // at all between rows once tiles wrap on a narrow phone.
    <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-px border border-border bg-divider">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-surface px-[18px] py-4">
          <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">{tile.label}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`font-mono text-[clamp(26px,3.4vw,34px)] font-light leading-none tracking-[-0.03em] tabular-nums ${TONE_CLASS[tile.tone]}`}
            >
              {tile.value}
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-ink-faint">{tile.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
