/**
 * A small two-line trend chart — commits (accent blue) and merged pull
 * requests (teal) over consecutive weekly buckets, oldest to newest,
 * left to right. Hand-rolled SVG rather than a charting library, matching
 * every other visualization in this app (the Dashboard's old bar chart,
 * ProgressGauge) being plain markup — no new dependency for two polylines.
 *
 * Purely presentational: the caller decides whether there's anything worth
 * showing at all (e.g. no chart when a project has no repository connected)
 * — an all-zero series here still renders as a real, flat, honest chart,
 * not an empty state.
 */
export function TrendChart({
  commits,
  merges,
  heightPx = 72,
}: {
  commits: number[];
  merges: number[];
  heightPx?: number;
}) {
  const weeks = Math.max(commits.length, merges.length, 1);
  const viewWidth = 100;
  const viewHeight = 32;
  const max = Math.max(1, ...commits, ...merges);

  const toPoints = (series: number[]) =>
    series
      .map((v, i) => {
        const x = weeks > 1 ? (i / (weeks - 1)) * viewWidth : viewWidth / 2;
        const y = viewHeight - (v / max) * viewHeight;
        return `${x},${y}`;
      })
      .join(" ");

  const totalCommits = commits.reduce((a, b) => a + b, 0);
  const totalMerges = merges.reduce((a, b) => a + b, 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height: heightPx }}
      >
        <line x1={0} y1={viewHeight} x2={viewWidth} y2={viewHeight} className="stroke-divider" strokeWidth={0.5} />
        <polyline
          points={toPoints(commits)}
          fill="none"
          className="stroke-accent"
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={toPoints(merges)}
          fill="none"
          className="stroke-teal"
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-3 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-ink-2">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />
          {totalCommits} COMMIT{totalCommits === 1 ? "" : "S"}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-ink-2">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal" />
          {totalMerges} MERGE{totalMerges === 1 ? "" : "S"}
        </span>
      </div>
    </div>
  );
}
