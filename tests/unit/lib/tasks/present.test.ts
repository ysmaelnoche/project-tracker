import { describe, expect, it } from "vitest";
import {
  buildProjectOptions,
  decorateTaskRow,
  isProjectLocked,
  type ProjectLite,
} from "@/lib/tasks/present";
import type { Task } from "@/lib/types";

const TODAY = "2026-09-05";

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    ref: "TSK-0102",
    projectId: null,
    title: "Row-level security policies",
    description: "",
    status: "todo",
    priority: "high",
    dueDate: null,
    dueTime: null,
    completedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function project(overrides: Partial<ProjectLite>): ProjectLite {
  return {
    id: "shipyard",
    ref: "PRJ-01",
    name: "Shipyard",
    type: "personal",
    status: "in_development",
    ...overrides,
  };
}

describe("isProjectLocked", () => {
  it("is locked only while pending", () => {
    expect(isProjectLocked("pending")).toBe(true);
    expect(isProjectLocked("in_development")).toBe(false);
    expect(isProjectLocked("production")).toBe(false);
    expect(isProjectLocked("paused")).toBe(false);
    expect(isProjectLocked("archived")).toBe(false);
  });
});

describe("buildProjectOptions", () => {
  it("excludes archived projects entirely", () => {
    const options = buildProjectOptions([
      project({ id: "a", status: "archived" }),
      project({ id: "b", status: "in_development" }),
    ]);
    expect(options.map((o) => o.id)).toEqual(["b"]);
  });

  it("marks a pending project disabled with a LOCKED marker", () => {
    const options = buildProjectOptions([
      project({ id: "halyard", ref: "PRJ-06", name: "Halyard", status: "pending" }),
    ]);
    expect(options).toHaveLength(1);
    const option = options[0]!;
    expect(option.disabled).toBe(true);
    expect(option.meta).toContain("LOCKED");
  });

  it("shows the stage label for an unlocked project instead of LOCKED", () => {
    const options = buildProjectOptions([project({ status: "production" })]);
    expect(options).toHaveLength(1);
    const option = options[0]!;
    expect(option.disabled).toBe(false);
    expect(option.meta).not.toContain("LOCKED");
  });

  it("labels the option with the project ref and name", () => {
    const options = buildProjectOptions([project({ ref: "PRJ-03", name: "Orbit" })]);
    expect(options).toHaveLength(1);
    const option = options[0]!;
    expect(option.label).toContain("PRJ-03");
    expect(option.label).toContain("Orbit");
  });
});

describe("decorateTaskRow", () => {
  it("marks a done task with a checkmark and the completion date", () => {
    const row = decorateTaskRow(
      task({ status: "done", completedAt: "2026-09-04", dueDate: "2026-09-01" }),
      null,
      TODAY,
    );
    expect(row.done).toBe(true);
    expect(row.tone).toBe("done");
    expect(row.rightLabel).toBe("✓ 2026.09.04");
  });

  it("flags an overdue open task and shows how many days late", () => {
    const row = decorateTaskRow(task({ status: "todo", dueDate: "2026-09-01" }), null, TODAY);
    expect(row.done).toBe(false);
    expect(row.tone).toBe("overdue");
    expect(row.rightLabel).toBe("⚠ OVERDUE T+4");
  });

  it("prefers a due time over a relative date when both are present and not overdue", () => {
    const row = decorateTaskRow(
      task({ status: "todo", dueDate: "2026-09-05", dueTime: "14:00" }),
      null,
      TODAY,
    );
    expect(row.rightLabel).toBe("14:00");
    expect(row.tone).toBe("normal");
  });

  it("shows a relative date when there's a due date but no due time", () => {
    const row = decorateTaskRow(task({ status: "todo", dueDate: "2026-09-06" }), null, TODAY);
    expect(row.rightLabel).toBe("T+1");
    expect(row.tone).toBe("normal");
  });

  it("shows nothing when there is no due date at all", () => {
    const row = decorateTaskRow(task({ status: "todo", dueDate: null }), null, TODAY);
    expect(row.rightLabel).toBe("");
  });

  it("flags an in-progress task", () => {
    const row = decorateTaskRow(task({ status: "in_progress" }), null, TODAY);
    expect(row.inProgress).toBe(true);
  });

  it("labels a standalone task as STANDALONE / PERSONAL", () => {
    const row = decorateTaskRow(task({ projectId: null }), null, TODAY);
    expect(row.ctxLabel).toContain("STANDALONE");
    expect(row.ctxLabel).toContain("PERSONAL");
  });

  it("labels a project task with the project's ref, name, and type", () => {
    const row = decorateTaskRow(
      task({ projectId: "lakehouse" }),
      project({ id: "lakehouse", ref: "PRJ-02", name: "Lakehouse Migration", type: "work" }),
      TODAY,
    );
    expect(row.ctxLabel).toContain("PRJ-02");
    expect(row.ctxLabel).toContain("LAKEHOUSE MIGRATION");
    expect(row.ctxLabel).toContain("WORK");
  });

  it("carries the raw priority and due date through, for the edit form to prefill from", () => {
    const row = decorateTaskRow(task({ priority: "high", dueDate: "2026-09-10" }), null, TODAY);
    expect(row.priority).toBe("high");
    expect(row.dueDate).toBe("2026-09-10");
  });
});
