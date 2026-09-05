import { describe, expect, it } from "vitest";
import { buildKeelSteps, KEEL_STEPS } from "@/lib/projects/create-sequence";
import { LINK_STEPS } from "@/lib/github/link-sequence";

describe("buildKeelSteps", () => {
  it("is just the hull/registry/ledger steps when no repo is being linked", () => {
    expect(buildKeelSteps(false)).toEqual(KEEL_STEPS);
  });

  it("appends the GitHub uplink steps when a repo is being linked", () => {
    const steps = buildKeelSteps(true);
    expect(steps).toEqual([...KEEL_STEPS, ...LINK_STEPS]);
    expect(steps).toHaveLength(KEEL_STEPS.length + LINK_STEPS.length);
  });
});
