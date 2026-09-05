import { describe, expect, it } from "vitest";
import {
  buildKeelSteps,
  KEEL_PAYOFF,
  KEEL_STEPS_DEPLOYED,
  KEEL_STEPS_IN_DEVELOPMENT,
  KEEL_STEPS_PENDING,
} from "@/lib/projects/create-sequence";
import { LINK_STEPS } from "@/lib/github/link-sequence";

describe("buildKeelSteps", () => {
  it("standby (pending): just the hull/registry/ledger steps, no repo", () => {
    expect(buildKeelSteps("pending", false)).toEqual(KEEL_STEPS_PENDING);
  });

  it("standby with a repo: appends the GitHub uplink steps", () => {
    const steps = buildKeelSteps("pending", true);
    expect(steps).toEqual([...KEEL_STEPS_PENDING, ...LINK_STEPS]);
  });

  it("build: its own steps, ending in joining the fleet already under construction", () => {
    const steps = buildKeelSteps("in_development", false);
    expect(steps).toEqual(KEEL_STEPS_IN_DEVELOPMENT);
    expect(steps.at(-1)?.label).toBe("JOINING FLEET AT BUILD");
  });

  it("build with a repo: uplink steps still appended after build's own steps", () => {
    const steps = buildKeelSteps("in_development", true);
    expect(steps).toEqual([...KEEL_STEPS_IN_DEVELOPMENT, ...LINK_STEPS]);
  });

  it("deployed: its own steps, ending in joining the fleet already shipped", () => {
    const steps = buildKeelSteps("production", false);
    expect(steps).toEqual(KEEL_STEPS_DEPLOYED);
    expect(steps.at(-1)?.label).toBe("JOINING FLEET AT DEPLOYED");
  });

  it("deployed with a repo: uplink steps still appended after deployed's own steps", () => {
    const steps = buildKeelSteps("production", true);
    expect(steps).toEqual([...KEEL_STEPS_DEPLOYED, ...LINK_STEPS]);
  });

  it("every stage's own steps are distinct from one another", () => {
    expect(KEEL_STEPS_PENDING).not.toEqual(KEEL_STEPS_IN_DEVELOPMENT);
    expect(KEEL_STEPS_PENDING).not.toEqual(KEEL_STEPS_DEPLOYED);
    expect(KEEL_STEPS_IN_DEVELOPMENT).not.toEqual(KEEL_STEPS_DEPLOYED);
  });
});

describe("KEEL_PAYOFF", () => {
  it("gives each entry stage its own distinct payoff term", () => {
    expect(KEEL_PAYOFF.pending).toBe("KEEL LAID");
    expect(KEEL_PAYOFF.in_development).toBe("BUILD LOGGED");
    expect(KEEL_PAYOFF.production).toBe("DEPLOYMENT LOGGED");
  });
});
