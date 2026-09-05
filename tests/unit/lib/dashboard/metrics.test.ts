import { describe, expect, it } from "vitest";
import { buildMetrics } from "@/lib/dashboard/metrics";
import type { ProjectStatus, TaskStatus } from "@/lib/types";

const TODAY = "2026-09-05";

function project(status: ProjectStatus) {
  return { status };
}
function task(status: TaskStatus, dueDate: string | null) {
  return { status, dueDate };
}

describe("buildMetrics", () => {
  it("counts FLEET as every non-archived project", () => {
    const projects = [project("pending"), project("in_development"), project("archived")];
    const tiles = buildMetrics(projects, [], 0, TODAY);
    expect(tiles.find((t) => t.label === "FLEET")?.value).toBe("02");
  });

  it("counts IN BUILD and DEPLOYED independently", () => {
    const projects = [
      project("in_development"),
      project("in_development"),
      project("production"),
      project("pending"),
    ];
    const tiles = buildMetrics(projects, [], 0, TODAY);
    expect(tiles.find((t) => t.label === "IN BUILD")?.value).toBe("02");
    expect(tiles.find((t) => t.label === "DEPLOYED")?.value).toBe("01");
  });

  it("passes OPEN PRS through and flags accent tone when non-zero", () => {
    const zero = buildMetrics([], [], 0, TODAY);
    expect(zero.find((t) => t.label === "OPEN PRS")?.value).toBe("00");
    expect(zero.find((t) => t.label === "OPEN PRS")?.tone).toBe("ink");

    const some = buildMetrics([], [], 3, TODAY);
    expect(some.find((t) => t.label === "OPEN PRS")?.value).toBe("03");
    expect(some.find((t) => t.label === "OPEN PRS")?.tone).toBe("accent");
  });

  it("DUE TODAY counts only open tasks due exactly today", () => {
    const tasks = [
      task("todo", TODAY),
      task("in_progress", TODAY),
      task("done", TODAY), // done tasks don't count
      task("todo", "2026-09-06"),
    ];
    const tiles = buildMetrics([], tasks, 0, TODAY);
    expect(tiles.find((t) => t.label === "DUE TODAY")?.value).toBe("02");
  });

  it("ALERTS counts open tasks overdue (due before today), tone red when non-zero", () => {
    const tasks = [
      task("todo", "2026-09-01"), // overdue
      task("done", "2026-09-01"), // done, doesn't count even though date has passed
      task("todo", TODAY), // due today, not overdue
      task("todo", null),
    ];
    const tiles = buildMetrics([], tasks, 0, TODAY);
    expect(tiles.find((t) => t.label === "ALERTS")?.value).toBe("01");
    expect(tiles.find((t) => t.label === "ALERTS")?.tone).toBe("red");

    const clear = buildMetrics([], [task("todo", TODAY)], 0, TODAY);
    expect(clear.find((t) => t.label === "ALERTS")?.value).toBe("00");
    expect(clear.find((t) => t.label === "ALERTS")?.tone).toBe("ink");
  });

  it("returns exactly six tiles in the Overview order", () => {
    const tiles = buildMetrics([], [], 0, TODAY);
    expect(tiles.map((t) => t.label)).toEqual([
      "FLEET",
      "IN BUILD",
      "OPEN PRS",
      "DEPLOYED",
      "DUE TODAY",
      "ALERTS",
    ]);
  });
});
