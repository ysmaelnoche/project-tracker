import { describe, expect, it } from "vitest";
import { buildSequenceLines, computeSequencePercent } from "@/lib/ui/sequence";
import type { SequenceStep } from "@/lib/ui/sequence";

const STEPS: SequenceStep[] = [
  { label: "STEP ONE", detail: "A" },
  { label: "STEP TWO", detail: "B" },
  { label: "STEP THREE", detail: "C" },
];

const FAIL_STEP: SequenceStep = { label: "REJECTED", detail: "SOMETHING DID NOT MATCH" };

describe("buildSequenceLines", () => {
  it("shows nothing before any step has been revealed", () => {
    expect(buildSequenceLines(STEPS, 0, false, FAIL_STEP)).toEqual([]);
  });

  it("shows revealed steps as done, in order, numbered from 01", () => {
    const lines = buildSequenceLines(STEPS, 2, false, FAIL_STEP);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ num: "01", label: "STEP ONE", detail: "A", mark: "done" });
    expect(lines[1]).toEqual({ num: "02", label: "STEP TWO", detail: "B", mark: "done" });
  });

  it("never reveals more steps than exist", () => {
    expect(buildSequenceLines(STEPS, STEPS.length + 5, false, FAIL_STEP)).toHaveLength(STEPS.length);
  });

  it("on failure, replaces the next unrevealed step with the given failure step instead of pretending it succeeded", () => {
    const lines = buildSequenceLines(STEPS, 1, true, FAIL_STEP);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.mark).toBe("done");
    expect(lines[1]).toEqual({ num: "02", label: "REJECTED", detail: "SOMETHING DID NOT MATCH", mark: "failed" });
  });

  it("caps the failure line at the last step rather than overflowing", () => {
    const lines = buildSequenceLines(STEPS, STEPS.length, true, FAIL_STEP);
    expect(lines).toHaveLength(STEPS.length);
    expect(lines.at(-1)!.mark).toBe("failed");
  });

  it("never shows a step succeeding after the point it actually failed, even if more had already been revealed", () => {
    // revealed=3 (all done) but failed=true still only shows 2 done + 1 failure,
    // matching the auth sequence's existing guarantee.
    const lines = buildSequenceLines(STEPS, STEPS.length, true, FAIL_STEP);
    expect(lines.filter((l) => l.mark === "done")).toHaveLength(STEPS.length - 1);
  });
});

describe("computeSequencePercent", () => {
  it("is 0 before any step is revealed", () => {
    expect(computeSequencePercent(STEPS, 0, false)).toBe(0);
  });

  it("is 100 once every step is revealed successfully", () => {
    expect(computeSequencePercent(STEPS, STEPS.length, false)).toBe(100);
  });

  it("counts the synthesized failure line toward the percentage", () => {
    expect(computeSequencePercent(STEPS, 0, true)).toBeGreaterThan(0);
  });

  it("never exceeds 100", () => {
    expect(computeSequencePercent(STEPS, STEPS.length + 3, false)).toBe(100);
  });
});
