import { describe, expect, it } from "vitest";
import { computeTaskProgress } from "@/lib/projects/progress";

describe("computeTaskProgress", () => {
  it("returns zeroes for a project with no tasks", () => {
    expect(computeTaskProgress([])).toEqual({ done: 0, total: 0 });
  });

  it("counts done vs total", () => {
    const tasks = [
      { status: "done" as const },
      { status: "done" as const },
      { status: "todo" as const },
    ];
    expect(computeTaskProgress(tasks)).toEqual({ done: 2, total: 3 });
  });

  it("treats in_progress tasks as not done", () => {
    const tasks = [{ status: "in_progress" as const }, { status: "done" as const }];
    expect(computeTaskProgress(tasks)).toEqual({ done: 1, total: 2 });
  });

  it("counts every task done when they all are", () => {
    const tasks = [{ status: "done" as const }, { status: "done" as const }];
    expect(computeTaskProgress(tasks)).toEqual({ done: 2, total: 2 });
  });
});
