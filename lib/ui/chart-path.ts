/**
 * Pure SVG path math for the "Trend Lasers" chart style (components/ui/TrendChart.tsx),
 * ported from the Claude Design mockup at design/README.md's linked project
 * (file `Trend Lasers.dc.html`). Kept separate from the component and
 * "server-only"-free so the curve math is unit-testable without a DOM.
 */

export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * A smooth curve running exactly through every point — a Catmull-Rom spline
 * converted to cubic Bezier segments. Unlike a quadratic-midpoint curve
 * (which only passes *near* each point), this hits every value exactly,
 * which is what makes a turn read as a deliberate round "C" rather than a
 * rough sketch. `tension` of `1` is neutral; below `1` softens turns,
 * above `1` sharpens them; `0` degenerates to straight segments between
 * points (control points collapse onto the endpoints).
 */
export function splinePath(points: ChartPoint[], tension = 1): string {
  if (points.length === 0) return "";

  const first = points[0]!;
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? points[i + 1]!;

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

/** Closes a line path into a fillable area: down to `baseY` under the last point, back to `baseY` under the first, done. */
export function areaPath(points: ChartPoint[], linePath: string, baseY: number): string {
  if (points.length === 0) return "";

  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath} L ${last.x.toFixed(2)} ${baseY} L ${first.x.toFixed(2)} ${baseY} Z`;
}
