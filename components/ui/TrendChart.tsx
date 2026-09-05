"use client";

import { useId, useRef, useState, type MouseEvent } from "react";
import { formatStamp } from "@/lib/format";
import { weekEndDate, weekStartDate } from "@/lib/github/dev-activity";
import { areaPath, splinePath, type ChartPoint } from "@/lib/ui/chart-path";
import { formatWeekDelta } from "@/lib/ui/chart-format";

// Literal geometry matching the Claude Design "Trend Lasers" mockup
// (design/README.md) — a fixed abstract canvas that scales to any width via
// the SVG's own viewBox, so the curve math never has to know the rendered
// pixel size.
const VIEW_W = 1200;
const VIEW_H = 360;
const PLOT_L = 40;
const PLOT_R = 1160;
const PLOT_T = 26;
const PLOT_B = 300;
const GRID_ROWS = 4;

// Literal hex, not Tailwind/theme-variable references: SVG `stop-color` and
// `fill`/`stroke` presentation attributes don't reliably resolve CSS custom
// properties across browsers (see TrendChart's original glow-filter
// comment) — kept in sync with the `--color-*` tokens in app/globals.css.
const BLUE = "#3ac0f0";
const ICE = "#7dd8ff";
const MINT = "#6fb3a8";
const RED = "#e4614a";

/** Rounds up to the next multiple of `GRID_ROWS` so the y-axis gets clean, evenly-spaced steps. */
function niceMax(value: number): number {
  const floor = Math.max(4, value);
  return Math.ceil(floor / GRID_ROWS) * GRID_ROWS;
}

/**
 * The "Trend Lasers" chart instrument — commits (blue) and merged pull
 * requests (teal) over consecutive weekly buckets, oldest to newest, left
 * to right. Ported from the Claude Design mockup `Trend Lasers.dc.html`
 * (design/README.md): a bordered instrument panel with corner brackets, a
 * header carrying a toggleable legend, glowing multi-layer "laser" curves
 * built from a Catmull-Rom spline (lib/ui/chart-path.ts) so every turn is a
 * round curve rather than a corner, a slow reticle and scan sweep for
 * ambient "hologram is live" motion, a real pixel-positioned hover tooltip,
 * and a footer stats strip.
 *
 * Otherwise purely presentational: the caller decides whether there's
 * anything worth showing at all (e.g. no chart when a project has no
 * repository connected) — an all-zero series here still renders as a real,
 * flat, honest chart, not an empty state.
 */
export function TrendChart({
  commits,
  merges,
  todayIso,
  meta,
}: {
  commits: number[];
  merges: number[];
  /** Today's date (YYYY-MM-DD), for labeling which week each hovered point covers. */
  todayIso: string;
  /** Trailing header label, e.g. "PRJ-03 · LAST 12 WEEKS". Defaults to a generic weeks label. */
  meta?: string;
}) {
  // Sanitized: React's useId() includes colons, which some browsers refuse
  // to resolve inside an SVG `url(#...)` reference.
  const filterId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [showMerges, setShowMerges] = useState(true);

  const weeks = Math.max(commits.length, merges.length, 1);
  const scaleMax = niceMax(Math.max(1, ...commits, ...merges));

  const xAt = (i: number) => (weeks > 1 ? PLOT_L + ((PLOT_R - PLOT_L) * i) / (weeks - 1) : (PLOT_L + PLOT_R) / 2);
  const yAt = (v: number) => PLOT_B - (PLOT_B - PLOT_T - 18) * (v / scaleMax);

  const commitPoints: ChartPoint[] = commits.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const mergePoints: ChartPoint[] = merges.map((v, i) => ({ x: xAt(i), y: yAt(v) }));

  const lineA = splinePath(commitPoints);
  const lineB = splinePath(mergePoints);
  const areaA = areaPath(commitPoints, lineA, PLOT_B);
  const areaB = areaPath(mergePoints, lineB, PLOT_B);

  const headA = commitPoints.at(-1);
  const headB = mergePoints.at(-1);

  const totalCommits = commits.reduce((a, b) => a + b, 0);
  const totalMerges = merges.reduce((a, b) => a + b, 0);
  const peakCommits = Math.max(0, ...commits);
  const meanCommits = commits.length ? Math.round(totalCommits / commits.length) : 0;
  const mergeRatio = totalCommits ? Math.round((totalMerges / totalCommits) * 100) : 0;

  const gridSteps = Array.from({ length: GRID_ROWS + 1 }, (_, i) => Math.round((scaleMax * i) / GRID_ROWS));
  // A label under every tick would overlap on a 12-week chart at mobile
  // widths — thin them out to roughly six, always keeping the first/last.
  const tickEvery = Math.max(1, Math.ceil(weeks / 6));

  function handleMove(e: MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const xUser = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < weeks; i++) {
      const d = Math.abs(xAt(i) - xUser);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    // Position the tooltip in real screen pixels against the measured box,
    // not viewBox percentages — the panel is rarely displayed at a size
    // proportional to VIEW_W x VIEW_H.
    const k = rect.width / VIEW_W;
    const tipW = 208;
    const tipH = showMerges ? 172 : 136;
    const pad = 10;
    const px = xAt(best) * k;
    const py = yAt(commits[best] ?? 0) * k;
    const half = tipW / 2;
    const maxLeft = Math.max(half + pad, rect.width - half - pad);
    const left = Math.min(Math.max(px, half + pad), maxLeft);
    const above = py > tipH + 24;
    let top = above ? py - 20 : py + tipH + 26;
    top = Math.min(Math.max(top, tipH + pad), Math.max(tipH + pad, rect.height - pad));

    setHoverIndex(best);
    setTooltipPos({ left, top });
  }

  const hovered = hoverIndex !== null;
  const hoverCommits = hoverIndex !== null ? (commits[hoverIndex] ?? 0) : 0;
  const hoverMerges = hoverIndex !== null ? (merges[hoverIndex] ?? 0) : 0;
  const hoverEnd = hoverIndex !== null ? weekEndDate(hoverIndex, weeks, todayIso) : null;
  const hoverStart = hoverIndex !== null ? weekStartDate(hoverIndex, weeks, todayIso) : null;
  const priorCommits = hoverIndex !== null && hoverIndex > 0 ? (commits[hoverIndex - 1] ?? 0) : null;
  const delta = hoverIndex !== null ? formatWeekDelta(hoverCommits, priorCommits) : null;
  const deltaInk = delta?.tone === "up" ? MINT : delta?.tone === "down" ? RED : "var(--color-ink-faint)";

  return (
    <div className="relative border border-border-strong bg-surface">
      {/* Corner brackets — the instrument's targeting-reticle frame. */}
      <div className="pointer-events-none absolute -top-px -left-px h-3.5 w-3.5 border-t border-l border-accent" />
      <div className="pointer-events-none absolute -top-px -right-px h-3.5 w-3.5 border-t border-r border-accent" />
      <div className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b border-l border-accent" />
      <div className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r border-accent" />

      <div className="flex flex-wrap items-baseline gap-3.5 border-b border-divider px-4 py-3">
        <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent shadow-[0_0_10px_rgba(58,192,240,0.85)] [animation:sweep_3s_ease-in-out_infinite]" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink">SOURCE ACTIVITY</span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {meta ?? `LAST ${weeks} WEEK${weeks === 1 ? "" : "S"}`}
        </span>
        <span className="ml-auto flex flex-wrap gap-3.5">
          <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.13em] text-ink">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent shadow-[0_0_8px_rgba(58,192,240,0.9)]" />
            COMMITS <span className="text-ink-faint">{totalCommits}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowMerges((v) => !v)}
            className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em]"
            style={{ color: showMerges ? "var(--color-ink)" : "var(--color-ink-faint)" }}
          >
            <span
              className="h-1.5 w-1.5 flex-none rounded-full"
              style={{
                background: showMerges ? MINT : "var(--color-border-strong)",
                boxShadow: showMerges ? "0 0 8px rgba(111,179,168,0.85)" : "none",
              }}
            />
            MERGES <span className="text-ink-faint">{totalMerges}</span>
          </button>
        </span>
      </div>

      <div className="relative" onMouseLeave={() => setHoverIndex(null)}>
        {/* A slow band of light drifting top-to-bottom — the hologram is live. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="absolute inset-x-0 h-1/4 bg-gradient-to-b from-transparent via-accent/[0.05] to-transparent [animation:scan-vertical_9s_linear_infinite]" />
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="relative block w-full"
          style={{ height: "auto" }}
          onMouseMove={handleMove}
        >
          <defs>
            <linearGradient id={`${filterId}-fill-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity="0.28" />
              <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${filterId}-fill-b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MINT} stopOpacity="0.2" />
              <stop offset="100%" stopColor={MINT} stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${filterId}-halo`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={BLUE} stopOpacity="0.55" />
              <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
            </radialGradient>
            <filter id={`${filterId}-bloom`} x="-30%" y="-120%" width="160%" height="340%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id={`${filterId}-halo-f`} x="-30%" y="-120%" width="160%" height="340%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <filter id={`${filterId}-soft`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          <rect x={0} y={0} width={VIEW_W} height={VIEW_H} className="fill-track" />

          {/* Holographic projection grid. */}
          <g opacity="0.5">
            {commitPoints.map((p, i) => (
              <line key={i} x1={p.x} y1={PLOT_T} x2={p.x} y2={PLOT_B} className="stroke-divider" strokeWidth={1} />
            ))}
            {gridSteps.map((v) => (
              <line key={v} x1={PLOT_L} y1={yAt(v)} x2={PLOT_R} y2={yAt(v)} className="stroke-divider" strokeWidth={1} />
            ))}
          </g>

          {/* A slow-rotating targeting reticle around the most recent point. */}
          {headA ? (
            <g opacity="0.5">
              <circle cx={headA.x} cy={headA.y} r={46} fill="none" className="stroke-accent/40" strokeWidth={1} />
              <circle
                cx={headA.x}
                cy={headA.y}
                r={74}
                fill="none"
                className="stroke-accent/30"
                strokeWidth={1}
                strokeDasharray="3 9"
                style={{ transformBox: "fill-box", transformOrigin: "center", animation: "reticle-spin 34s linear infinite" }}
              />
              <circle cx={headA.x} cy={headA.y} r={104} fill="none" className="stroke-accent/20" strokeWidth={1} strokeDasharray="1 14" />
              <line x1={headA.x} y1={12} x2={headA.x} y2={headA.y - 30} className="stroke-accent/35" strokeWidth={1} strokeDasharray="2 7" />
            </g>
          ) : null}

          <line x1={PLOT_L} y1={PLOT_B} x2={PLOT_R} y2={PLOT_B} className="stroke-accent/30" strokeWidth={1} />

          {showMerges ? (
            <g>
              <path d={areaB} fill={`url(#${filterId}-fill-b)`} />
              <path d={lineB} fill="none" stroke={MINT} strokeWidth={9} strokeLinecap="round" opacity={0.22} filter={`url(#${filterId}-bloom)`} />
              <path d={lineB} fill="none" stroke={MINT} strokeWidth={3.4} strokeLinecap="round" opacity={0.7} filter={`url(#${filterId}-halo-f)`} />
              <path d={lineB} fill="none" stroke={MINT} strokeWidth={1.5} strokeLinecap="round" />
              <path d={lineB} fill="none" stroke="#eafff9" strokeWidth={0.6} strokeLinecap="round" opacity={0.8} />
            </g>
          ) : null}

          <g>
            <path d={areaA} fill={`url(#${filterId}-fill-a)`} />
            <path d={lineA} fill="none" stroke={BLUE} strokeWidth={13} strokeLinecap="round" opacity={0.26} filter={`url(#${filterId}-bloom)`} />
            <path d={lineA} fill="none" stroke={BLUE} strokeWidth={4.4} strokeLinecap="round" opacity={0.72} filter={`url(#${filterId}-halo-f)`} />
            <path d={lineA} fill="none" stroke={BLUE} strokeWidth={1.7} strokeLinecap="round" />
            <path d={lineA} fill="none" stroke="#f2fbff" strokeWidth={0.7} strokeLinecap="round" opacity={0.9} />
            <path
              d={lineA}
              fill="none"
              stroke="#ddf3ff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="26 214"
              style={{ animation: "laser-flow 5.4s linear infinite" }}
              opacity={0.55}
            />
          </g>

          {hoverIndex !== null ? (
            <g style={{ animation: "fade 0.12s ease" }}>
              <line
                x1={xAt(hoverIndex)}
                y1={PLOT_T}
                x2={xAt(hoverIndex)}
                y2={PLOT_B}
                stroke={ICE}
                strokeWidth={6}
                opacity={0.12}
                filter={`url(#${filterId}-soft)`}
              />
              <line
                x1={xAt(hoverIndex)}
                y1={PLOT_T}
                x2={xAt(hoverIndex)}
                y2={PLOT_B}
                stroke={ICE}
                strokeWidth={1}
                opacity={0.65}
                strokeDasharray="4 5"
              />
              <circle cx={xAt(hoverIndex)} cy={yAt(hoverCommits)} r={17} fill={`url(#${filterId}-halo)`} />
              <circle cx={xAt(hoverIndex)} cy={yAt(hoverCommits)} r={5.5} fill="none" stroke={ICE} strokeWidth={1.2} />
              <circle cx={xAt(hoverIndex)} cy={yAt(hoverCommits)} r={2.4} fill="#ffffff" />
              {showMerges ? (
                <>
                  <circle cx={xAt(hoverIndex)} cy={yAt(hoverMerges)} r={4.4} fill="none" stroke={MINT} strokeWidth={1.2} />
                  <circle cx={xAt(hoverIndex)} cy={yAt(hoverMerges)} r={1.9} fill="#eafff9" />
                </>
              ) : null}
            </g>
          ) : null}

          {headA ? (
            <g>
              <circle
                cx={headA.x}
                cy={headA.y}
                r={5}
                fill="none"
                stroke={ICE}
                strokeWidth={1.4}
                opacity={0.9}
                style={{ transformBox: "fill-box", transformOrigin: "center", animation: "ping-ring 3.2s ease-out infinite" }}
              />
              <circle
                cx={headA.x}
                cy={headA.y}
                r={5}
                fill="none"
                stroke={BLUE}
                strokeWidth={1}
                opacity={0.6}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animation: "ping-ring 3.2s ease-out 0.9s infinite",
                }}
              />
              <circle cx={headA.x} cy={headA.y} r={26} fill={`url(#${filterId}-halo)`} />
              <circle cx={headA.x} cy={headA.y} r={6.4} className="fill-track" stroke={ICE} strokeWidth={1.5} />
              <circle cx={headA.x} cy={headA.y} r={2.8} fill="#ffffff" />
            </g>
          ) : null}
          {showMerges && headB ? (
            <g>
              <circle cx={headB.x} cy={headB.y} r={14} fill={`url(#${filterId}-halo)`} opacity={0.5} />
              <circle cx={headB.x} cy={headB.y} r={4.6} className="fill-track" stroke={MINT} strokeWidth={1.3} />
              <circle cx={headB.x} cy={headB.y} r={1.9} fill="#eafff9" />
            </g>
          ) : null}

          <rect
            x={PLOT_L}
            y={PLOT_T}
            width={PLOT_R - PLOT_L}
            height={PLOT_B - PLOT_T}
            fill="transparent"
            style={{ cursor: "crosshair" }}
          />
        </svg>

        {/* Axis labels, positioned as percentages of the shared viewBox. */}
        <div className="pointer-events-none absolute inset-0">
          {commits.map((_, i) =>
            i % tickEvery === 0 || i === weeks - 1 ? (
              <div
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.1em]"
                style={{
                  left: `${(xAt(i) / VIEW_W) * 100}%`,
                  top: `${(318 / VIEW_H) * 100}%`,
                  color: hovered && i === hoverIndex ? ICE : "var(--color-ink-faint)",
                }}
              >
                {formatStamp(weekEndDate(i, weeks, todayIso))}
              </div>
            ) : null,
          )}
          {gridSteps.map((v) => (
            <div
              key={v}
              className="absolute -translate-y-1/2 text-right font-mono text-[9px] tracking-[0.08em] text-ink-faint"
              style={{ left: 0, width: 30, top: `${(yAt(v) / VIEW_H) * 100}%` }}
            >
              {String(v).padStart(2, "0")}
            </div>
          ))}
        </div>

        {hovered && hoverEnd ? (
          <div
            className="pointer-events-none absolute z-10 w-[208px] -translate-x-1/2 -translate-y-full border border-accent/40 bg-surface-raised shadow-[0_18px_44px_-14px_rgba(0,0,0,0.9),0_0_34px_-8px_rgba(58,192,240,0.35)] [animation:lift_0.14s_ease]"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
          >
            <div className="flex items-baseline gap-2.5 border-b border-divider px-3 py-2">
              <span className="font-mono text-[9px] tracking-[0.16em] text-accent-hover">
                WEEK ENDING {formatStamp(hoverEnd)}
              </span>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[9px] tracking-[0.1em] text-ink-faint">{formatStamp(hoverStart)} — {formatStamp(hoverEnd)}</div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                <span className="font-mono text-[9px] tracking-[0.13em] text-ink-2">COMMITS</span>
                <span className="ml-auto font-mono text-[17px] tabular-nums text-ink">{hoverCommits}</span>
              </div>
              {showMerges ? (
                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal" />
                  <span className="font-mono text-[9px] tracking-[0.13em] text-ink-2">MERGES</span>
                  <span className="ml-auto font-mono text-[17px] tabular-nums text-ink">{hoverMerges}</span>
                </div>
              ) : null}
              {delta ? (
                <div className="mt-2.5 flex items-baseline gap-2.5 border-t border-divider pt-2.5">
                  <span className="font-mono text-[9px] tracking-[0.13em] text-ink-faint">VS PRIOR</span>
                  <span className="ml-auto font-mono text-[10px] tracking-[0.08em]" style={{ color: deltaInk }}>
                    {delta.text}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-6 border-t border-divider px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">TOTAL</span>
          <span className="font-mono text-xs tabular-nums text-ink">{totalCommits} COMMITS</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">PEAK</span>
          <span className="font-mono text-xs tabular-nums text-accent-hover">{peakCommits}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">MEAN</span>
          <span className="font-mono text-xs tabular-nums text-ink-2">{meanCommits} / WEEK</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">MERGE RATIO</span>
          <span className="font-mono text-xs tabular-nums text-teal">{mergeRatio}%</span>
        </div>
        <span className="ml-auto font-mono text-[9px] tracking-[0.13em]" style={{ color: hovered ? ICE : "var(--color-ink-faint)" }}>
          {hovered && hoverEnd ? `LOCKED ON ${formatStamp(hoverEnd)}` : "SWEEP THE FIELD TO ARM THE CROSSHAIR"}
        </span>
      </div>
    </div>
  );
}
