import { describe, expect, it } from "vitest";
import { pickNextTask, type NextTaskCandidate } from "@/lib/next-task";

// Deterministic "what's next" logic per PLAN.md "Next Action":
// in-progress first, then priority, then earlier due date, then older task.
function task(overrides: Partial<NextTaskCandidate>): NextTaskCandidate {
  return {
    id: "t1",
    status: "todo",
    priority: "medium",
    dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pickNextTask", () => {
  it("returns null when there are no unfinished tasks", () => {
    expect(pickNextTask([])).toBeNull();
    expect(pickNextTask([task({ id: "a", status: "done" })])).toBeNull();
  });

  it("ignores done tasks", () => {
    const a = task({ id: "a", status: "done", priority: "high" });
    const b = task({ id: "b", status: "todo", priority: "low" });
    expect(pickNextTask([a, b])?.id).toBe("b");
  });

  it("prefers an in-progress task over a higher-priority todo", () => {
    const a = task({ id: "a", status: "todo", priority: "high" });
    const b = task({ id: "b", status: "in_progress", priority: "low" });
    expect(pickNextTask([a, b])?.id).toBe("b");
  });

  it("otherwise prefers higher priority", () => {
    const low = task({ id: "low", priority: "low" });
    const high = task({ id: "high", priority: "high" });
    const medium = task({ id: "medium", priority: "medium" });
    expect(pickNextTask([low, high, medium])?.id).toBe("high");
  });

  it("otherwise prefers a task that has a due date over one that doesn't", () => {
    const noDue = task({ id: "no-due", dueDate: null });
    const due = task({ id: "due", dueDate: "2026-09-10" });
    expect(pickNextTask([noDue, due])?.id).toBe("due");
  });

  it("among tasks with due dates, prefers the earlier one", () => {
    const later = task({ id: "later", dueDate: "2026-09-20" });
    const earlier = task({ id: "earlier", dueDate: "2026-09-05" });
    expect(pickNextTask([later, earlier])?.id).toBe("earlier");
  });

  it("falls back to the older task when everything else ties", () => {
    const newer = task({ id: "newer", createdAt: "2026-02-01T00:00:00.000Z" });
    const older = task({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" });
    expect(pickNextTask([newer, older])?.id).toBe("older");
  });
});
