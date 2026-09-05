import { describe, expect, it } from "vitest";
import { deriveEntryStageFields } from "@/lib/projects/entry-stage";

const TODAY = "2026-09-06";

describe("deriveEntryStageFields", () => {
  it("standby (pending): keeps only the operator's own target date, nothing else", () => {
    expect(deriveEntryStageFields("pending", "2026-12-01", TODAY)).toEqual({
      status: "pending",
      devStartDate: null,
      publishedDate: null,
      targetDate: "2026-12-01",
    });
  });

  it("standby with no target date given", () => {
    expect(deriveEntryStageFields("pending", null, TODAY)).toEqual({
      status: "pending",
      devStartDate: null,
      publishedDate: null,
      targetDate: null,
    });
  });

  it("build: records today as the build start, keeps the operator's target date", () => {
    expect(deriveEntryStageFields("in_development", "2026-12-01", TODAY)).toEqual({
      status: "in_development",
      devStartDate: TODAY,
      publishedDate: null,
      targetDate: "2026-12-01",
    });
  });

  it("build with no target date given", () => {
    expect(deriveEntryStageFields("in_development", null, TODAY)).toEqual({
      status: "in_development",
      devStartDate: TODAY,
      publishedDate: null,
      targetDate: null,
    });
  });

  it("deployed: records today as the deploy date, never a build start we don't actually know, and drops any target date", () => {
    expect(deriveEntryStageFields("production", "2026-12-01", TODAY)).toEqual({
      status: "production",
      devStartDate: null,
      publishedDate: TODAY,
      targetDate: null,
    });
  });

  it("deployed with no target date given", () => {
    expect(deriveEntryStageFields("production", null, TODAY)).toEqual({
      status: "production",
      devStartDate: null,
      publishedDate: TODAY,
      targetDate: null,
    });
  });
});
