import { describe, expect, it } from "vitest";
import { daysUntilPurgeEligible, isPurgeEligible, PURGE_GRACE_DAYS } from "@/lib/projects/purge";

const TODAY = "2026-09-05";

function daysBeforeToday(n: number): string {
  const d = new Date(Date.UTC(2026, 8, 5)); // 2026-09-05
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString(); // full timestamp, matching a timestamptz column
}

describe("isPurgeEligible", () => {
  it("is never eligible when the project was never archived", () => {
    expect(isPurgeEligible(null, TODAY)).toBe(false);
  });

  it("is not eligible the moment it's archived", () => {
    expect(isPurgeEligible(daysBeforeToday(0), TODAY)).toBe(false);
  });

  it("is not eligible one day short of the grace period", () => {
    expect(isPurgeEligible(daysBeforeToday(PURGE_GRACE_DAYS - 1), TODAY)).toBe(false);
  });

  it("is eligible exactly at the grace period boundary", () => {
    expect(isPurgeEligible(daysBeforeToday(PURGE_GRACE_DAYS), TODAY)).toBe(true);
  });

  it("stays eligible well past the boundary", () => {
    expect(isPurgeEligible(daysBeforeToday(PURGE_GRACE_DAYS + 30), TODAY)).toBe(true);
  });

  it("honors a custom grace period", () => {
    expect(isPurgeEligible(daysBeforeToday(5), TODAY, 5)).toBe(true);
    expect(isPurgeEligible(daysBeforeToday(4), TODAY, 5)).toBe(false);
  });
});

describe("daysUntilPurgeEligible", () => {
  it("is null when the project was never archived", () => {
    expect(daysUntilPurgeEligible(null, TODAY)).toBeNull();
  });

  it("is the full grace period the moment it's archived", () => {
    expect(daysUntilPurgeEligible(daysBeforeToday(0), TODAY)).toBe(PURGE_GRACE_DAYS);
  });

  it("counts down as days pass", () => {
    expect(daysUntilPurgeEligible(daysBeforeToday(5), TODAY)).toBe(PURGE_GRACE_DAYS - 5);
  });

  it("is 0 once eligible, never negative", () => {
    expect(daysUntilPurgeEligible(daysBeforeToday(PURGE_GRACE_DAYS), TODAY)).toBe(0);
    expect(daysUntilPurgeEligible(daysBeforeToday(PURGE_GRACE_DAYS + 30), TODAY)).toBe(0);
  });
});
