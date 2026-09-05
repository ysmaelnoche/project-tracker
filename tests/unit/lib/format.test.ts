import { describe, expect, it } from "vitest";
import { diffDays, formatStamp, isOverdue, relativeUpcoming } from "@/lib/format";

describe("formatStamp", () => {
  it("converts ISO dashes to dots", () => {
    expect(formatStamp("2026-09-05")).toBe("2026.09.05");
  });

  it("returns an empty string for null/undefined", () => {
    expect(formatStamp(null)).toBe("");
    expect(formatStamp(undefined)).toBe("");
  });
});

describe("diffDays", () => {
  it("is positive when the second date is later", () => {
    expect(diffDays("2026-09-05", "2026-09-08")).toBe(3);
  });

  it("is negative when the second date is earlier", () => {
    expect(diffDays("2026-09-05", "2026-09-01")).toBe(-4);
  });

  it("is zero for the same date", () => {
    expect(diffDays("2026-09-05", "2026-09-05")).toBe(0);
  });
});

describe("isOverdue", () => {
  it("is true for a past due date that isn't done", () => {
    expect(isOverdue("2026-09-01", "2026-09-05", false)).toBe(true);
  });

  it("is false once the task is done, even if the date is past", () => {
    expect(isOverdue("2026-09-01", "2026-09-05", true)).toBe(false);
  });

  it("is false with no due date", () => {
    expect(isOverdue(null, "2026-09-05", false)).toBe(false);
  });

  it("is false for a future due date", () => {
    expect(isOverdue("2026-09-10", "2026-09-05", false)).toBe(false);
  });
});

describe("relativeUpcoming", () => {
  it("labels today as TODAY", () => {
    expect(relativeUpcoming("2026-09-05", "2026-09-05")).toBe("TODAY");
  });

  it("labels tomorrow as T+1", () => {
    expect(relativeUpcoming("2026-09-06", "2026-09-05")).toBe("T+1");
  });

  it("labels within a week as T+n", () => {
    expect(relativeUpcoming("2026-09-11", "2026-09-05")).toBe("T+6");
  });

  it("falls back to the stamp a week or more out", () => {
    expect(relativeUpcoming("2026-09-12", "2026-09-05")).toBe("2026.09.12");
  });

  it("falls back to the stamp for a past date", () => {
    expect(relativeUpcoming("2026-09-01", "2026-09-05")).toBe("2026.09.01");
  });
});
