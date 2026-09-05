import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScuttleSequence } from "@/components/projects/ScuttleSequence";

describe("ScuttleSequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderSequence(overrides?: { onScuttle?: () => Promise<{ ok: boolean; error?: string }> }) {
    const onScuttle = overrides?.onScuttle ?? vi.fn().mockResolvedValue({ ok: true });
    const onScuttled = vi.fn();
    const onClose = vi.fn();

    render(
      <ScuttleSequence
        open
        projectRef="PRJ-02"
        projectName="Orbit"
        onScuttle={onScuttle}
        onScuttled={onScuttled}
        onClose={onClose}
      />,
    );

    return { onScuttle, onScuttled, onClose };
  }

  it("starts the countdown at 5 and shows the emergency framing", () => {
    renderSequence();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("⚠ EMERGENCY")).toBeInTheDocument();
  });

  it("counts down once per second while not aborted", () => {
    renderSequence();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("clicking ABORT stops the countdown immediately — the number never reaches the scuttle buffer", () => {
    const { onScuttle } = renderSequence();

    act(() => {
      vi.advanceTimersByTime(2000); // now at 3
    });
    fireEvent.click(screen.getByText("✕ ABORT"));

    act(() => {
      vi.advanceTimersByTime(5000); // long enough to have reached zero if still running
    });

    expect(onScuttle).not.toHaveBeenCalled();
  });

  it("shows a stand-down confirmation immediately after aborting", () => {
    renderSequence();
    fireEvent.click(screen.getByText("✕ ABORT"));
    expect(screen.getByText("STAND DOWN")).toBeInTheDocument();
    expect(screen.queryByText("⚠ EMERGENCY")).not.toBeInTheDocument();
  });

  it("calls onClose only after the stand-down confirmation has been shown for a moment", () => {
    const { onClose } = renderSequence();
    fireEvent.click(screen.getByText("✕ ABORT"));

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("proceeds to scuttle when the countdown is never aborted", () => {
    const { onScuttle } = renderSequence();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onScuttle).toHaveBeenCalledTimes(1);
  });
});
