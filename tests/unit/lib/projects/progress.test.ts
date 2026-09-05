import { describe, expect, it } from "vitest";
import { computeTaskProgress } from "@/lib/projects/progress";

describe("computeTaskProgress", () => {
  it("returns zeroes for a project with no tasks, without dividing by zero", () => {
    expect(computeTaskProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("counts done vs total and rounds the percentage", () => {
    const tasks = [
      { status: "done" as const },
      { status: "done" as const },
      { status: "todo" as const },
    ];
    expect(computeTaskProgress(tasks)).toEqual({ done: 2, total: 3, percent: 67 });
  });

  it("treats in_progress tasks as not done", () => {
    const tasks = [{ status: "in_progress" as const }, { status: "done" as const }];
    expect(computeTaskProgress(tasks)).toEqual({ done: 1, total: 2, percent: 50 });
  });

  it("is 100% only when every task is done", () => {
    const tasks = [{ status: "done" as const }, { status: "done" as const }];
    expect(computeTaskProgress(tasks)).toEqual({ done: 2, total: 2, percent: 100 });
  });
});
