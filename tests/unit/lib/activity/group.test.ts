import { describe, expect, it } from "vitest";
import { groupActivityByDay } from "@/lib/activity/group";
import type { ActivityEvent } from "@/lib/types";

const NOW = new Date(2026, 8, 5, 14, 30); // 2026-09-05, local time — matches TODAY across the app's tests

function event(overrides: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: "a1",
    verb: "TASK COMPLETE",
    subject: "Untitled",
    contextRef: "PRJ-01",
    tone: "teal",
    createdAt: "2026-09-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("groupActivityByDay", () => {
  it("returns an empty array for no events", () => {
    expect(groupActivityByDay([], NOW)).toEqual([]);
  });

  it("labels events from the current local day as TODAY", () => {
    const groups = groupActivityByDay([event({ createdAt: new Date(2026, 8, 5, 9, 0).toISOString() })], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("TODAY");
  });

  it("labels events from the previous local day as YESTERDAY", () => {
    const groups = groupActivityByDay([event({ createdAt: new Date(2026, 8, 4, 9, 0).toISOString() })], NOW);
    expect(groups[0]?.label).toBe("YESTERDAY");
  });

  it("labels older events with a dotted date stamp", () => {
    const groups = groupActivityByDay([event({ createdAt: new Date(2026, 7, 20, 9, 0).toISOString() })], NOW);
    expect(groups[0]?.label).toBe("2026.08.20");
  });

  it("groups multiple same-day events together, preserving their order", () => {
    const first = event({ id: "a", createdAt: new Date(2026, 8, 5, 16, 0).toISOString() });
    const second = event({ id: "b", createdAt: new Date(2026, 8, 5, 9, 0).toISOString() });
    const groups = groupActivityByDay([first, second], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("keeps separate day groups in the order they first appear (newest-first input)", () => {
    const today = event({ id: "today", createdAt: new Date(2026, 8, 5, 9, 0).toISOString() });
    const yesterday = event({ id: "yesterday", createdAt: new Date(2026, 8, 4, 9, 0).toISOString() });
    const older = event({ id: "older", createdAt: new Date(2026, 7, 20, 9, 0).toISOString() });
    const groups = groupActivityByDay([today, yesterday, older], NOW);
    expect(groups.map((g) => g.label)).toEqual(["TODAY", "YESTERDAY", "2026.08.20"]);
  });
});
