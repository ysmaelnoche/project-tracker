import { describe, expect, it } from "vitest";
import { areaPath, splinePath } from "@/lib/ui/chart-path";

describe("splinePath", () => {
  it("returns an empty string for no points", () => {
    expect(splinePath([])).toBe("");
  });

  it("returns a bare move-to for a single point", () => {
    expect(splinePath([{ x: 3, y: 4 }])).toBe("M 3.00 4.00");
  });

  it("curves through two points at neutral tension", () => {
    const d = splinePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      1,
    );
    expect(d).toBe("M 0.00 0.00 C 1.67 1.67, 8.33 8.33, 10.00 10.00");
  });

  it("degenerates to a straight segment at zero tension", () => {
    const d = splinePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      0,
    );
    // Control points collapse onto the endpoints — still a cubic Bezier
    // command, but geometrically identical to a straight line.
    expect(d).toBe("M 0.00 0.00 C 0.00 0.00, 10.00 10.00, 10.00 10.00");
  });

  it("passes exactly through every interior point", () => {
    const d = splinePath([
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 5 },
      { x: 30, y: 15 },
    ]);
    // Every original point appears as a curve-to endpoint, in order.
    expect(d).toContain("M 0.00 0.00");
    expect(d).toContain("10.00 20.00");
    expect(d).toContain("20.00 5.00");
    expect(d).toContain("30.00 15.00");
  });
});

describe("areaPath", () => {
  it("returns an empty string for no points", () => {
    expect(areaPath([], "", 20)).toBe("");
  });

  it("closes the line down to the baseline and back to the start", () => {
    const points = [
      { x: 0, y: 5 },
      { x: 10, y: 2 },
    ];
    const line = "M 0.00 5.00 L 10.00 2.00";
    expect(areaPath(points, line, 20)).toBe("M 0.00 5.00 L 10.00 2.00 L 10.00 20 L 0.00 20 Z");
  });
});
