import { describe, expect, it } from "vitest";
import { computeStatusLineCounts, formatStatusLine } from "@/lib/dashboard/status-line";

const TODAY = "2026-09-05";

describe("computeStatusLineCounts", () => {
  it("counts fleet (non-archived), build (in_development), queue (open tasks) and alerts (overdue open tasks)", () => {
    const projects = [
      { status: "pending" as const },
      { status: "in_development" as const },
      { status: "in_development" as const },
      { status: "archived" as const },
    ];
    const tasks = [
      { status: "todo" as const, dueDate: "2026-09-01" }, // overdue
      { status: "todo" as const, dueDate: TODAY },
      { status: "done" as const, dueDate: "2026-09-01" }, // done, excluded everywhere
    ];
    expect(computeStatusLineCounts(projects, tasks, TODAY)).toEqual({
      fleet: 3,
      build: 2,
      queue: 2,
      alerts: 1,
    });
  });
});

describe("formatStatusLine", () => {
  it("formats zero-padded counts in the FLEET/BUILD/QUEUE/ALERTS order", () => {
    expect(formatStatusLine({ fleet: 3, build: 1, queue: 7, alerts: 0 })).toBe(
      "FLEET 03 · BUILD 01 · QUEUE 07 · ALERTS 00",
    );
  });
});
