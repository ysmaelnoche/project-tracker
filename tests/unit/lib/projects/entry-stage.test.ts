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

  it("deployed: the date field means \"when did this actually deploy\" — uses the operator's own date, never a build start we don't actually know", () => {
    expect(deriveEntryStageFields("production", "2026-08-20", TODAY)).toEqual({
      status: "production",
      devStartDate: null,
      publishedDate: "2026-08-20",
      targetDate: null,
    });
  });

  it("deployed: defaults the deploy date to today when the operator leaves it blank", () => {
    expect(deriveEntryStageFields("production", null, TODAY)).toEqual({
      status: "production",
      devStartDate: null,
      publishedDate: TODAY,
      targetDate: null,
    });
  });

  it("deployed: a future-dated input is still just carried through — this function doesn't validate, only maps", () => {
    expect(deriveEntryStageFields("production", "2099-01-01", TODAY).publishedDate).toBe("2099-01-01");
  });
});
