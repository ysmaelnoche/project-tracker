import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditTaskDialog, type EditTaskFields } from "@/components/tasks/EditTaskDialog";

const INITIAL: EditTaskFields = {
  title: "Row-level security policies",
  priority: "medium",
  dueDate: "2026-09-10",
};

describe("EditTaskDialog", () => {
  it("renders nothing when closed", () => {
    render(<EditTaskDialog open={false} initial={INITIAL} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prefills the form from the task's current fields", () => {
    render(<EditTaskDialog open initial={INITIAL} onSave={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByDisplayValue("Row-level security policies")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-09-10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "STANDARD" })).toHaveClass("bg-accent");
  });

  it("disables Save once the title is cleared", () => {
    render(<EditTaskDialog open initial={INITIAL} onSave={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("Row-level security policies"), {
      target: { value: "   " },
    });

    expect(screen.getByRole("button", { name: "SAVE" })).toBeDisabled();
  });

  it("calls onSave with the trimmed, edited fields", () => {
    const onSave = vi.fn();
    render(<EditTaskDialog open initial={INITIAL} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("Row-level security policies"), {
      target: { value: "  Updated title  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "CRITICAL" }));
    fireEvent.change(screen.getByDisplayValue("2026-09-10"), { target: { value: "2026-09-20" } });
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "Updated title",
      priority: "high",
      dueDate: "2026-09-20",
    });
  });

  it("calls onClose without saving when Cancel is clicked", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditTaskDialog open initial={INITIAL} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "CANCEL" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a saving state and disables both actions while pending", () => {
    render(<EditTaskDialog open initial={INITIAL} pending onSave={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: /SAVING/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "CANCEL" })).toBeDisabled();
  });
});
