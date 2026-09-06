import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskRow } from "@/components/tasks/TaskRow";
import type { TaskRowView } from "@/lib/tasks/present";

function row(overrides?: Partial<TaskRowView>): TaskRowView {
  return {
    id: "t1",
    ref: "TSK-0102",
    title: "Row-level security policies",
    done: false,
    inProgress: false,
    ctxLabel: "TSK-0102 · STANDALONE · PERSONAL",
    rightLabel: "",
    tone: "normal",
    priority: "medium",
    dueDate: null,
    ...overrides,
  };
}

describe("TaskRow", () => {
  it("calls onEdit when the edit control is clicked", () => {
    const onEdit = vi.fn();
    render(<TaskRow row={row()} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit task" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("does not call onDelete or onToggle when editing", () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskRow row={row()} onToggle={onToggle} onDelete={onDelete} onEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit task" }));

    expect(onToggle).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
