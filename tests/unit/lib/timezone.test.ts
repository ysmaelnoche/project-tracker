import { describe, expect, it } from "vitest";
import { todayInTimezone } from "@/lib/timezone";

describe("todayInTimezone", () => {
  it("rolls over to the next day in a timezone ahead of UTC before UTC itself does", () => {
    // 17:00 UTC on Sept 5 is already 01:00 on Sept 6 in Manila (UTC+8).
    const now = new Date("2026-09-05T17:00:00.000Z");
    expect(todayInTimezone("Asia/Manila", now)).toBe("2026-09-06");
    expect(todayInTimezone("UTC", now)).toBe("2026-09-05");
  });

  it("stays on the previous day in a timezone behind UTC after UTC has already rolled over", () => {
    // 03:00 UTC on Sept 6 is still 20:00 on Sept 5 in Los Angeles (UTC-7, PDT in September).
    const now = new Date("2026-09-06T03:00:00.000Z");
    expect(todayInTimezone("America/Los_Angeles", now)).toBe("2026-09-05");
    expect(todayInTimezone("UTC", now)).toBe("2026-09-06");
  });

  it("defaults to the current instant when no `now` is given", () => {
    expect(todayInTimezone("UTC")).toBe(new Date().toISOString().slice(0, 10));
  });
});
