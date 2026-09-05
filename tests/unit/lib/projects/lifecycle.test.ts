import { describe, expect, it } from "vitest";
import {
  canTogglePause,
  deriveRestoreStatus,
  deriveStageStrip,
  isTaskCreationLocked,
} from "@/lib/projects/lifecycle";

describe("deriveRestoreStatus", () => {
  // The Shipyard design reference's restore() collapses every archived project
  // back to only "pending" or "production" (published ? 'production' : 'pending'),
  // which silently loses "this was actively in development". We derive from the
  // fields that already exist instead, so an archived in-development project is
  // restored to in_development, not demoted back to pending.
  it("restores to production when a published date is on record", () => {
    expect(
      deriveRestoreStatus({ publishedDate: "2026-07-02", devStartDate: "2026-05-11" }),
    ).toBe("production");
  });

  it("restores to in_development when there's a dev start but no published date", () => {
    expect(deriveRestoreStatus({ publishedDate: null, devStartDate: "2026-08-22" })).toBe(
      "in_development",
    );
  });

  it("restores to pending when neither date is on record", () => {
    expect(deriveRestoreStatus({ publishedDate: null, devStartDate: null })).toBe("pending");
  });

  it("prefers production even if somehow both dates are set out of order", () => {
    expect(
      deriveRestoreStatus({ publishedDate: "2026-01-01", devStartDate: "2026-02-01" }),
    ).toBe("production");
  });
});

describe("isTaskCreationLocked", () => {
  it("is locked only while pending", () => {
    expect(isTaskCreationLocked("pending")).toBe(true);
    expect(isTaskCreationLocked("in_development")).toBe(false);
    expect(isTaskCreationLocked("paused")).toBe(false);
    expect(isTaskCreationLocked("production")).toBe(false);
    expect(isTaskCreationLocked("archived")).toBe(false);
  });
});

describe("canTogglePause", () => {
  it("allows toggling only between in_development and paused", () => {
    expect(canTogglePause("in_development")).toBe(true);
    expect(canTogglePause("paused")).toBe(true);
    expect(canTogglePause("pending")).toBe(false);
    expect(canTogglePause("production")).toBe(false);
    expect(canTogglePause("archived")).toBe(false);
  });
});

describe("deriveStageStrip", () => {
  const today = "2026-09-05";

  it("marks standby active and holding when nothing has started", () => {
    const stages = deriveStageStrip(
      { status: "pending", devStartDate: null, publishedDate: null, targetDate: "2026-11-01" },
      today,
    );
    expect(stages).toHaveLength(3);
    expect(stages[0]).toMatchObject({ code: "STANDBY", value: "HOLDING", state: "active" });
    expect(stages[1]).toMatchObject({ code: "BUILD", note: "UNLOCKS ON INITIATE", state: "upcoming" });
    expect(stages[2]).toMatchObject({ code: "DEPLOYED", note: "TARGET DATE", state: "upcoming" });
  });

  it("marks build active with elapsed days while in development", () => {
    const stages = deriveStageStrip(
      {
        status: "in_development",
        devStartDate: "2026-08-22",
        publishedDate: null,
        targetDate: "2026-09-20",
      },
      today,
    );
    expect(stages[0]).toMatchObject({ value: "CLEARED", state: "done" });
    expect(stages[1]).toMatchObject({
      value: "2026.08.22",
      note: "T+14 DAYS ELAPSED",
      state: "active",
    });
    expect(stages[2]).toMatchObject({ note: "TARGET DATE", state: "upcoming" });
  });

  it("marks deployed active with total duration once published", () => {
    const stages = deriveStageStrip(
      {
        status: "production",
        devStartDate: "2026-05-11",
        publishedDate: "2026-07-02",
        targetDate: null,
      },
      today,
    );
    expect(stages[1]).toMatchObject({ note: "BUILD WINDOW OPENED", state: "done" });
    expect(stages[2]).toMatchObject({
      value: "2026.07.02",
      note: "52 DAYS TOTAL",
      state: "active",
    });
  });

  it("treats paused and archived the same as in_development for stage position", () => {
    const base = { devStartDate: "2026-08-22", publishedDate: null, targetDate: null };
    expect(deriveStageStrip({ ...base, status: "paused" }, today)[1]?.state).toBe("active");
    expect(deriveStageStrip({ ...base, status: "archived" }, today)[1]?.state).toBe("active");
  });
});
