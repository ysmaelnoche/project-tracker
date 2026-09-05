"use client";

import { useId, useState, type MouseEvent } from "react";
import { formatStamp } from "@/lib/format";
import { weekEndDate } from "@/lib/github/dev-activity";

type Point = [number, number];

/**
 * A smooth curve through `points` — quadratic Bezier segments using each
 * original point as the control and the midpoint between it and the next
 * as the on-curve target, except the final segment which curves exactly to
 * the last point. Simple, no overshoot, no spline library: the standard
 * lightweight technique for "smooth line through points" without a real
 * curve-fitting dependency.
 */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  const [firstX, firstY] = points[0]!;
  if (points.length === 1) return `M ${firstX} ${firstY}`;

  let d = `M ${firstX} ${firstY}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    if (i === points.length - 2) {
      d += ` Q ${x0} ${y0} ${x1} ${y1}`;
    } else {
      d += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
    }
  }
  return d;
}

/**
 * A small two-line trend chart — commits (accent blue) and merged pull
 * requests (teal) over consecutive weekly buckets, oldest to newest, left
 * to right — styled as a glowing HUD readout: smoothed "laser" curves with
 * an SVG blur-glow filter, a pulsing beacon at each line's most recent
 * point, and a faint holographic grid + scanning sweep behind everything.
 * Hand-rolled SVG rather than a charting library, matching every other
 * visualization in this app being plain markup.
 *
 * Hovering (or touching, on mobile) a point shows the week it covers and
 * that week's exact commit/merge counts — a guide line plus highlighted
 * dots on both series track the same point.
 *
 * Otherwise purely presentational: the caller decides whether there's
 * anything worth showing at all (e.g. no chart when a project has no
 * repository connected) — an all-zero series here still renders as a
 * real, flat, honest chart, not an empty state.
 */
export function TrendChart({
  commits,
  merges,
  todayIso,
  heightPx = 72,
}: {
  commits: number[];
  merges: number[];
  /** Today's date (YYYY-MM-DD), for labeling which week each hovered point covers. */
  todayIso: string;
  heightPx?: number;
}) {
  // Sanitized: React's useId() includes colons, which some browsers refuse
  // to resolve inside an SVG `url(#...)` reference (CSS identifier escaping
  // rules bleeding into what's really just a plain IDREF match).
  const filterId = useId().replace(/:/g, "");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const weeks = Math.max(commits.length, merges.length, 1);
  const viewWidth = 100;
  const viewHeight = 32;
  const max = Math.max(1, ...commits, ...merges);

  const xAt = (i: number) => (weeks > 1 ? (i / (weeks - 1)) * viewWidth : viewWidth / 2);
  const yAt = (v: number) => viewHeight - (v / max) * viewHeight;

  const commitPoints: Point[] = commits.map((v, i) => [xAt(i), yAt(v)]);
  const mergePoints: Point[] = merges.map((v, i) => [xAt(i), yAt(v)]);
  const lastCommit = commitPoints.at(-1);
  const lastMerge = mergePoints.at(-1);

  const totalCommits = commits.reduce((a, b) => a + b, 0);
  const totalMerges = merges.reduce((a, b) => a + b, 0);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (weeks - 1));
    setHoverIndex(Math.min(Math.max(index, 0), weeks - 1));
  }

  const hovered = hoverIndex !== null;
  const hoverLeftPercent = hoverIndex !== null ? Math.min(Math.max(xAt(hoverIndex), 6), 94) : 0;
  const hoverCommits = hoverIndex !== null ? (commits[hoverIndex] ?? 0) : 0;
  const hoverMerges = hoverIndex !== null ? (merges[hoverIndex] ?? 0) : 0;
  const hoverDate = hoverIndex !== null ? weekEndDate(hoverIndex, weeks, todayIso) : null;

  return (
    <div>
      <div
        className="relative overflow-hidden border border-divider bg-track"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Holographic scan sweep — a faint band of light drifting across the
            projection, the same idea as the loading screens' scan bars. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/10 to-transparent [animation:scan-wide_5s_linear_infinite]" />
        </div>

        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          className="relative w-full overflow-visible"
          style={{ height: heightPx }}
        >
          <defs>
            <linearGradient id={`${filterId}-wash`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ac0f0" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3ac0f0" stopOpacity="0" />
            </linearGradient>
            <filter id={`${filterId}-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.5" result="blurred" />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hologram backdrop: an ambient wash plus a faint projection grid. */}
          <rect x={0} y={0} width={viewWidth} height={viewHeight} fill={`url(#${filterId}-wash)`} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              y1={viewHeight * f}
              x2={viewWidth}
              y2={viewHeight * f}
              className="stroke-accent/10"
              strokeWidth={0.3}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {commitPoints.map(([x], i) =>
            i % 2 === 0 ? (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={viewHeight}
                className="stroke-accent/5"
                strokeWidth={0.3}
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )}
          <line x1={0} y1={viewHeight} x2={viewWidth} y2={viewHeight} className="stroke-divider" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />

          {hoverIndex !== null ? (
            <line
              x1={xAt(hoverIndex)}
              y1={0}
              x2={xAt(hoverIndex)}
              y2={viewHeight}
              className="stroke-ink-faint"
              strokeWidth={0.4}
              strokeDasharray="2,1.5"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {/* The laser lines themselves — smoothed curves with a soft glow. */}
          <path
            d={smoothPath(mergePoints)}
            fill="none"
            className="stroke-teal"
            strokeWidth={1.3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId}-glow)`}
          />
          <path
            d={smoothPath(commitPoints)}
            fill="none"
            className="stroke-accent"
            strokeWidth={1.3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId}-glow)`}
          />

          {/* A small node at every point, brighter at the most recent one. */}
          {mergePoints.map(([x, y], i) => (
            <circle key={`m${i}`} cx={x} cy={y} r={i === mergePoints.length - 1 ? 1.3 : 0.7} className="fill-teal" />
          ))}
          {commitPoints.map(([x, y], i) => (
            <circle key={`c${i}`} cx={x} cy={y} r={i === commitPoints.length - 1 ? 1.3 : 0.7} className="fill-accent" />
          ))}

          {/* A pulsing "current position" beacon at the leading edge of each line. */}
          {lastMerge ? (
            <circle
              cx={lastMerge[0]}
              cy={lastMerge[1]}
              r={1.6}
              className="fill-none stroke-teal [animation:ping-ring_2s_ease-out_infinite]"
              strokeWidth={0.6}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ) : null}
          {lastCommit ? (
            <circle
              cx={lastCommit[0]}
              cy={lastCommit[1]}
              r={1.6}
              className="fill-none stroke-accent [animation:ping-ring_2s_ease-out_infinite]"
              strokeWidth={0.6}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ) : null}

          {hoverIndex !== null ? (
            <>
              <circle cx={xAt(hoverIndex)} cy={yAt(hoverCommits)} r={1.9} className="fill-accent stroke-bg" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              <circle cx={xAt(hoverIndex)} cy={yAt(hoverMerges)} r={1.9} className="fill-teal stroke-bg" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            </>
          ) : null}

          {/* An invisible, evenly-spaced hit target per bucket — bigger and
              easier to land on with a mouse (or a finger) than the thin
              lines themselves. */}
          {commits.map((_, i) => (
            <rect key={i} x={xAt(i) - viewWidth / weeks / 2} y={0} width={viewWidth / weeks} height={viewHeight} fill="transparent" />
          ))}
        </svg>

        {hovered ? (
          <div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap border border-border-strong bg-surface-raised px-2.5 py-1.5 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.7)]"
            style={{ left: `${hoverLeftPercent}%` }}
          >
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink-faint">
              WEEK ENDING {formatStamp(hoverDate)}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] text-ink">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                {hoverCommits} COMMIT{hoverCommits === 1 ? "" : "S"}
              </span>
              <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] text-ink">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal" />
                {hoverMerges} MERGE{hoverMerges === 1 ? "" : "S"}
              </span>
            </div>
          </div>
        ) : null}
      </div>

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
