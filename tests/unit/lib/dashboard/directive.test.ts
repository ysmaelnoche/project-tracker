import { describe, expect, it } from "vitest";
import { pickPrimaryDirective, type DirectiveProject, type DirectiveTask } from "@/lib/dashboard/directive";

const TODAY = "2026-09-05";

function task(overrides: Partial<DirectiveTask>): DirectiveTask {
  return {
    id: "t1",
    title: "Untitled",
    status: "todo",
    priority: "medium",
    dueDate: null,
    ...overrides,
  };
}

function project(overrides: Partial<DirectiveProject>): DirectiveProject {
  return {
    id: "p1",
    ref: "PRJ-01",
    name: "Orbit",
    nextTask: null,
    ...overrides,
  };
}

describe("pickPrimaryDirective", () => {
  it("returns null when there are no active projects", () => {
    expect(pickPrimaryDirective([], TODAY)).toBeNull();
  });

  it("returns null when no active project has a next task", () => {
    const projects = [project({ id: "a", nextTask: null }), project({ id: "b", nextTask: null })];
    expect(pickPrimaryDirective(projects, TODAY)).toBeNull();
  });

  it("skips projects with no next task and picks the one that has one", () => {
    const projects = [
      project({ id: "a", nextTask: null }),
      project({ id: "b", nextTask: task({ id: "t-b" }) }),
    ];
    const result = pickPrimaryDirective(projects, TODAY);
    expect(result?.projectId).toBe("b");
    expect(result?.task.id).toBe("t-b");
  });

  it("an in-progress task always beats a not-started task, regardless of priority", () => {
    const projects = [
      project({ id: "a", nextTask: task({ id: "high-todo", status: "todo", priority: "high" }) }),
      project({ id: "b", nextTask: task({ id: "low-active", status: "in_progress", priority: "low" }) }),
    ];
    expect(pickPrimaryDirective(projects, TODAY)?.task.id).toBe("low-active");
  });

  it("among equally-active tasks, higher priority wins", () => {
    const projects = [
      project({ id: "a", nextTask: task({ id: "low", priority: "low" }) }),
      project({ id: "b", nextTask: task({ id: "high", priority: "high" }) }),
    ];
    expect(pickPrimaryDirective(projects, TODAY)?.task.id).toBe("high");
  });

  it("an overdue low-priority task can outrank a not-yet-due high-priority task", () => {
    const projects = [
      project({
        id: "a",
        nextTask: task({ id: "high-not-due", priority: "high", dueDate: "2026-09-10" }),
      }),
      project({
        id: "b",
        nextTask: task({ id: "low-overdue", priority: "low", dueDate: "2026-09-01" }),
      }),
    ];
    expect(pickPrimaryDirective(projects, TODAY)?.task.id).toBe("low-overdue");
  });

  it("keeps the first project on an exact tie (stable)", () => {
    const projects = [
      project({ id: "first", nextTask: task({ id: "t1", priority: "medium" }) }),
      project({ id: "second", nextTask: task({ id: "t2", priority: "medium" }) }),
    ];
    expect(pickPrimaryDirective(projects, TODAY)?.projectId).toBe("first");
  });

  it("builds a meta line with priority and an overdue marker", () => {
    const projects = [
      project({
        id: "a",
        ref: "PRJ-01",
        name: "Orbit",
        nextTask: task({ id: "t1", priority: "high", status: "in_progress", dueDate: "2026-09-01" }),
      }),
    ];
    const result = pickPrimaryDirective(projects, TODAY);
    expect(result?.meta).toContain("ACTIVE");
    expect(result?.meta).toContain("CRITICAL PRIORITY");
    expect(result?.meta).toContain("OVERDUE");
  });

  it("builds a 'NO DEADLINE' meta line when the task has no due date", () => {
    const projects = [project({ id: "a", nextTask: task({ id: "t1", dueDate: null }) })];
    expect(pickPrimaryDirective(projects, TODAY)?.meta).toContain("NO DEADLINE");
  });
});
