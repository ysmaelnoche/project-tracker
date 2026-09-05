import { describe, expect, it } from "vitest";
import { isValidTargetDate } from "@/lib/projects/target-date";

const TODAY = "2026-09-06";

describe("isValidTargetDate", () => {
  it("no date at all is always fine — it's optional", () => {
    expect(isValidTargetDate(null, null, TODAY)).toBe(true);
    expect(isValidTargetDate(null, "2026-01-01", TODAY)).toBe(true);
  });

  it("today is fine", () => {
    expect(isValidTargetDate(TODAY, null, TODAY)).toBe(true);
  });

  it("a future date is fine", () => {
    expect(isValidTargetDate("2026-12-01", null, TODAY)).toBe(true);
  });

  it("a brand-new past date is rejected — nothing stored yet to match against", () => {
    expect(isValidTargetDate("2026-01-01", null, TODAY)).toBe(false);
  });

  it("a past date is accepted when it's exactly what's already stored — an overdue target shouldn't block an unrelated edit", () => {
    expect(isValidTargetDate("2026-01-01", "2026-01-01", TODAY)).toBe(true);
  });

  it("switching from one past date to a different past date is rejected", () => {
    expect(isValidTargetDate("2026-02-01", "2026-01-01", TODAY)).toBe(false);
  });

  it("switching from a valid future date to a new past date is rejected", () => {
    expect(isValidTargetDate("2026-01-01", "2026-12-01", TODAY)).toBe(false);
  });
});
