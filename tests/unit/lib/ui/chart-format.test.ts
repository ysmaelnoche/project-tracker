import { describe, expect, it } from "vitest";
import { formatWeekDelta } from "@/lib/ui/chart-format";

describe("formatWeekDelta", () => {
  it("has no prior week for the first bucket on record", () => {
    expect(formatWeekDelta(5, null)).toEqual({ text: "FIRST WEEK ON RECORD", tone: "none" });
  });

  it("reads flat when unchanged", () => {
    expect(formatWeekDelta(5, 5)).toEqual({ text: "— FLAT", tone: "flat" });
  });

  it("formats a rise with a percentage", () => {
    expect(formatWeekDelta(8, 5)).toEqual({ text: "▲ +3 (+60%)", tone: "up" });
  });

  it("formats a decline with a percentage", () => {
    expect(formatWeekDelta(2, 5)).toEqual({ text: "▼ -3 (-60%)", tone: "down" });
  });

  it("drops the percentage when the prior week was zero", () => {
    expect(formatWeekDelta(4, 0)).toEqual({ text: "▲ +4", tone: "up" });
  });
});
