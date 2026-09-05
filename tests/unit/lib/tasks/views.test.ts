import { describe, expect, it } from "vitest";
import {
  bucketTasksByView,
  buildTaskQueueHref,
  countsByView,
  filterTasksByContext,
  parseTaskContext,
  parseTaskView,
  sortTaskRows,
  todayIso,
  TASK_VIEW_EMPTY_COPY,
} from "@/lib/tasks/views";
import type { Task } from "@/lib/types";

const TODAY = "2026-09-05";

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    ref: "TSK-0001",
    projectId: null,
    title: "Untitled",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    dueTime: null,
    completedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseTaskView", () => {
  it("passes through known view keys", () => {
    expect(parseTaskView("upcoming")).toBe("upcoming");
    expect(parseTaskView("overdue")).toBe("overdue");
    expect(parseTaskView("all")).toBe("all");
    expect(parseTaskView("completed")).toBe("completed");
  });

  it("defaults to 'today' for missing/unknown values", () => {
    expect(parseTaskView(undefined)).toBe("today");
    expect(parseTaskView(null)).toBe("today");
    expect(parseTaskView("bogus")).toBe("today");
  });
});

describe("parseTaskContext", () => {
  it("passes through known context keys", () => {
    expect(parseTaskContext("project")).toBe("project");
    expect(parseTaskContext("standalone")).toBe("standalone");
  });

  it("defaults to 'all' for missing/unknown values", () => {
    expect(parseTaskContext(undefined)).toBe("all");
    expect(parseTaskContext("bogus")).toBe("all");
  });
});

describe("todayIso", () => {
  it("formats a given date as YYYY-MM-DD in local time", () => {
    expect(todayIso(new Date(2026, 8, 5, 23, 59))).toBe("2026-09-05");
  });

  it("zero-pads single-digit months and days", () => {
    expect(todayIso(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});

describe("filterTasksByContext", () => {
  const standalone = task({ id: "s1", projectId: null });
  const projectTask = task({ id: "p1", projectId: "proj-1" });
  const tasks = [standalone, projectTask];

  it("returns everything for 'all'", () => {
    expect(filterTasksByContext(tasks, "all")).toEqual(tasks);
  });

  it("returns only tasks without a project for 'standalone'", () => {
    expect(filterTasksByContext(tasks, "standalone")).toEqual([standalone]);
  });

  it("returns only tasks with a project for 'project'", () => {
    expect(filterTasksByContext(tasks, "project")).toEqual([projectTask]);
  });
});

describe("bucketTasksByView", () => {
  const dueYesterday = task({ id: "overdue", dueDate: "2026-09-04", status: "todo" });
  const dueToday = task({ id: "today", dueDate: "2026-09-05", status: "todo" });
  const dueTomorrow = task({ id: "tomorrow", dueDate: "2026-09-06", status: "in_progress" });
  const noDueDate = task({ id: "no-due", dueDate: null, status: "todo" });
  const doneOverdueDate = task({
    id: "done-but-was-overdue",
    dueDate: "2026-09-01",
    status: "done",
    completedAt: "2026-09-02",
  });
  const all = [dueYesterday, dueToday, dueTomorrow, noDueDate, doneOverdueDate];

  it("'today' includes anything open due today or earlier (overdue rolls into today)", () => {
    const ids = bucketTasksByView(all, "today", TODAY).map((t) => t.id);
    expect(ids.sort()).toEqual(["overdue", "today"].sort());
  });

  it("'upcoming' is open tasks due strictly after today", () => {
    const ids = bucketTasksByView(all, "upcoming", TODAY).map((t) => t.id);
    expect(ids).toEqual(["tomorrow"]);
  });

  it("'overdue' is open tasks due strictly before today", () => {
    const ids = bucketTasksByView(all, "overdue", TODAY).map((t) => t.id);
    expect(ids).toEqual(["overdue"]);
  });

  it("'all' is every open task regardless of due date, including tasks with none", () => {
    const ids = bucketTasksByView(all, "all", TODAY).map((t) => t.id).sort();
    expect(ids).toEqual(["no-due", "overdue", "today", "tomorrow"].sort());
  });

  it("'completed' is only done tasks, even ones that were once overdue", () => {
    const ids = bucketTasksByView(all, "completed", TODAY).map((t) => t.id);
    expect(ids).toEqual(["done-but-was-overdue"]);
  });

  it("excludes done tasks from every open view", () => {
    for (const view of ["today", "upcoming", "overdue", "all"] as const) {
      const ids = bucketTasksByView(all, view, TODAY).map((t) => t.id);
      expect(ids).not.toContain("done-but-was-overdue");
    }
  });
});

describe("countsByView", () => {
  it("counts each view independently against the same task list", () => {
    const tasks = [
      task({ id: "1", status: "todo", dueDate: "2026-09-01" }), // overdue + today
      task({ id: "2", status: "todo", dueDate: "2026-09-10" }), // upcoming
      task({ id: "3", status: "done" }), // completed
      task({ id: "4", status: "todo", dueDate: null }), // all only
    ];
    const counts = countsByView(tasks, TODAY);
    expect(counts).toEqual({
      today: 1,
      upcoming: 1,
      overdue: 1,
      all: 3,
      completed: 1,
    });
  });
});

describe("sortTaskRows", () => {
  it("puts tasks with a due date before tasks without one", () => {
    const noDue = task({ id: "no-due", dueDate: null });
    const withDue = task({ id: "with-due", dueDate: "2026-09-10" });
    const sorted = sortTaskRows([noDue, withDue]);
    expect(sorted.map((t) => t.id)).toEqual(["with-due", "no-due"]);
  });

  it("orders tasks with due dates earliest-first", () => {
    const later = task({ id: "later", dueDate: "2026-09-20" });
    const earlier = task({ id: "earlier", dueDate: "2026-09-05" });
    const sorted = sortTaskRows([later, earlier]);
    expect(sorted.map((t) => t.id)).toEqual(["earlier", "later"]);
  });

  it("is stable for ties (equal or both-missing due dates)", () => {
    const a = task({ id: "a", dueDate: null });
    const b = task({ id: "b", dueDate: null });
    const c = task({ id: "c", dueDate: "2026-09-05" });
    const d = task({ id: "d", dueDate: "2026-09-05" });
    expect(sortTaskRows([a, b]).map((t) => t.id)).toEqual(["a", "b"]);
    expect(sortTaskRows([d, c]).map((t) => t.id)).toEqual(["d", "c"]);
  });
});

describe("buildTaskQueueHref", () => {
  it("omits both params for the defaults", () => {
    expect(buildTaskQueueHref("today", "all")).toBe("/tasks");
  });

  it("sets only the view param when context is the default", () => {
    expect(buildTaskQueueHref("overdue", "all")).toBe("/tasks?view=overdue");
  });

  it("sets only the context param when view is the default", () => {
    expect(buildTaskQueueHref("today", "standalone")).toBe("/tasks?context=standalone");
  });

  it("preserves the other filter when both are non-default", () => {
    const href = buildTaskQueueHref("completed", "project");
    expect(href).toContain("view=completed");
    expect(href).toContain("context=project");
  });
});

describe("TASK_VIEW_EMPTY_COPY", () => {
  it("has an entry for every view", () => {
    for (const view of ["today", "upcoming", "overdue", "all", "completed"] as const) {
      expect(TASK_VIEW_EMPTY_COPY[view].title.length).toBeGreaterThan(0);
    }
  });
});
