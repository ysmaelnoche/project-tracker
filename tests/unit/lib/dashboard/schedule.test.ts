import { describe, expect, it } from "vitest";
import { buildUpcoming, selectMyDayTasks, type UpcomingTaskInput } from "@/lib/dashboard/schedule";

const TODAY = "2026-09-05";

describe("selectMyDayTasks", () => {
  it("returns overdue tasks before tasks due today", () => {
    const tasks = [
      { id: "today", status: "todo" as const, dueDate: TODAY },
      { id: "overdue", status: "todo" as const, dueDate: "2026-09-01" },
    ];
    const result = selectMyDayTasks(tasks, TODAY);
    expect(result.map((t) => t.id)).toEqual(["overdue", "today"]);
  });

  it("excludes done tasks and tasks due in the future or with no due date", () => {
    const tasks = [
      { id: "done", status: "done" as const, dueDate: "2026-09-01" },
      { id: "future", status: "todo" as const, dueDate: "2026-09-10" },
      { id: "no-due", status: "todo" as const, dueDate: null },
      { id: "keep", status: "todo" as const, dueDate: TODAY },
    ];
    expect(selectMyDayTasks(tasks, TODAY).map((t) => t.id)).toEqual(["keep"]);
  });

  it("preserves incoming order within each bucket", () => {
    const tasks = [
      { id: "od-1", status: "todo" as const, dueDate: "2026-09-01" },
      { id: "od-2", status: "todo" as const, dueDate: "2026-09-02" },
      { id: "td-1", status: "todo" as const, dueDate: TODAY },
      { id: "td-2", status: "todo" as const, dueDate: TODAY },
    ];
    expect(selectMyDayTasks(tasks, TODAY).map((t) => t.id)).toEqual([
      "od-1",
      "od-2",
      "td-1",
      "td-2",
    ]);
  });
});

function upcomingTask(overrides: Partial<UpcomingTaskInput>): UpcomingTaskInput {
  return {
    status: "todo",
    dueDate: "2026-09-10",
    title: "Untitled",
    contextLabel: "STANDALONE",
    ...overrides,
  };
}

describe("buildUpcoming", () => {
  it("only includes open tasks due strictly after today", () => {
    const tasks = [
      upcomingTask({ dueDate: TODAY, title: "today" }),
      upcomingTask({ dueDate: "2026-09-01", title: "past" }),
      upcomingTask({ dueDate: "2026-09-10", title: "future" }),
      upcomingTask({ dueDate: "2026-09-06", status: "done", title: "done-future" }),
    ];
    const result = buildUpcoming(tasks, [], TODAY);
    expect(result.map((e) => e.title)).toEqual(["future"]);
  });

  it("sorts task entries soonest first and caps at taskCap", () => {
    const tasks = [
      upcomingTask({ dueDate: "2026-09-20", title: "later" }),
      upcomingTask({ dueDate: "2026-09-06", title: "soonest" }),
      upcomingTask({ dueDate: "2026-09-15", title: "middle" }),
    ];
    const result = buildUpcoming(tasks, [], TODAY, 2);
    expect(result.map((e) => e.title)).toEqual(["soonest", "middle"]);
  });

  it("appends future milestones from active projects after the task entries", () => {
    const tasks = [upcomingTask({ dueDate: "2026-09-06", title: "task-1" })];
    const milestones = [{ title: "Orbit", targetDate: "2026-09-08" }];
    const result = buildUpcoming(tasks, milestones, TODAY);
    expect(result.map((e) => e.title)).toEqual(["task-1", "Target deployment — Orbit"]);
    expect(result[1]?.isMilestone).toBe(true);
    expect(result[1]?.ctx).toBe("MILESTONE");
  });

  it("drops milestones whose target date is today or in the past", () => {
    const milestones = [
      { title: "Past", targetDate: "2026-09-01" },
      { title: "Today", targetDate: TODAY },
      { title: "Future", targetDate: "2026-09-09" },
    ];
    const result = buildUpcoming([], milestones, TODAY);
    expect(result.map((e) => e.title)).toEqual(["Target deployment — Future"]);
  });

  it("caps the combined task+milestone list at `cap`", () => {
    const tasks = [
      upcomingTask({ dueDate: "2026-09-06", title: "t1" }),
      upcomingTask({ dueDate: "2026-09-07", title: "t2" }),
    ];
    const milestones = [
      { title: "m1", targetDate: "2026-09-08" },
      { title: "m2", targetDate: "2026-09-09" },
    ];
    const result = buildUpcoming(tasks, milestones, TODAY, 5, 3);
    expect(result).toHaveLength(3);
  });
});
