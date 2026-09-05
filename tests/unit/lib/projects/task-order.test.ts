import { describe, expect, it } from "vitest";
import { sortProjectTasks } from "@/lib/projects/task-order";
import type { ProjectTaskRow } from "@/lib/projects/task-reads";

function task(id: string, status: ProjectTaskRow["status"]): ProjectTaskRow {
  return { id, ref: id, title: id, status, priority: "medium", dueDate: null, createdAt: "2026-01-01" };
}

describe("sortProjectTasks", () => {
  it("pushes done tasks to the bottom regardless of original order", () => {
    const tasks = [task("a", "done"), task("b", "todo"), task("c", "in_progress")];
    expect(sortProjectTasks(tasks).map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts in-progress ahead of todo among open tasks", () => {
    const tasks = [task("a", "todo"), task("b", "in_progress")];
    expect(sortProjectTasks(tasks).map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("keeps original order among ties", () => {
    const tasks = [task("a", "todo"), task("b", "todo"), task("c", "todo")];
    expect(sortProjectTasks(tasks).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const tasks = [task("a", "done"), task("b", "todo")];
    const copy = [...tasks];
    sortProjectTasks(tasks);
    expect(tasks).toEqual(copy);
  });
});
