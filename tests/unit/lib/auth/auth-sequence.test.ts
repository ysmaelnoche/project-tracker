import { describe, expect, it } from "vitest";
import { AUTH_STEPS, buildAuthLines, computeAuthPercent } from "@/lib/auth/auth-sequence";

describe("buildAuthLines", () => {
  it("shows nothing before any step has been revealed", () => {
    expect(buildAuthLines(0, false)).toEqual([]);
  });

  it("shows revealed steps as done, in order, numbered from 01", () => {
    const lines = buildAuthLines(2, false);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({
      num: "01",
      label: AUTH_STEPS[0]!.label,
      detail: AUTH_STEPS[0]!.detail,
      mark: "done",
    });
    expect(lines[1]!.num).toBe("02");
    expect(lines[1]!.mark).toBe("done");
  });

  it("never reveals more steps than exist", () => {
    const lines = buildAuthLines(AUTH_STEPS.length + 5, false);
    expect(lines).toHaveLength(AUTH_STEPS.length);
  });

  it("on failure, replaces the next unrevealed step with a rejection instead of pretending it succeeded", () => {
    const lines = buildAuthLines(2, true);
    expect(lines).toHaveLength(3);
    expect(lines[0]!.mark).toBe("done");
    expect(lines[1]!.mark).toBe("done");
    expect(lines[2]!.mark).toBe("failed");
    expect(lines[2]!.label).not.toBe(AUTH_STEPS[2]!.label);
  });

  it("caps the failure line at the last step rather than overflowing", () => {
    const lines = buildAuthLines(AUTH_STEPS.length, true);
    expect(lines).toHaveLength(AUTH_STEPS.length);
    expect(lines.at(-1)!.mark).toBe("failed");
  });
});

describe("computeAuthPercent", () => {
  it("is 0 before any step is revealed", () => {
    expect(computeAuthPercent(0, false)).toBe(0);
  });

  it("is 100 once every step is revealed successfully", () => {
    expect(computeAuthPercent(AUTH_STEPS.length, false)).toBe(100);
  });

  it("counts the synthesized failure line toward the percentage", () => {
    expect(computeAuthPercent(0, true)).toBeGreaterThan(0);
  });

  it("never exceeds 100", () => {
    expect(computeAuthPercent(AUTH_STEPS.length + 3, false)).toBe(100);
  });
});
