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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] border border-border bg-surface">
      {tiles.map((tile) => (
        <div key={tile.label} className="border-r border-divider px-[18px] py-4">
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
