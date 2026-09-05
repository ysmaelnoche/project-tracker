import { describe, expect, it } from "vitest";
import {
  buildYearWindow,
  computeMonthLabels,
  contributionLevel,
  totalForWindow,
} from "@/lib/github/contributions";

describe("contributionLevel", () => {
  it("is 0 for no contributions, regardless of the day's max", () => {
    expect(contributionLevel(0, 10)).toBe(0);
  });

  it("is 0 when nothing happened all year (max is 0 too)", () => {
    expect(contributionLevel(0, 0)).toBe(0);
  });

  it("is the top level for the day matching the year's max", () => {
    expect(contributionLevel(10, 10)).toBe(4);
  });

  it("scales proportionally between 1 and 4 for a day with some activity", () => {
    expect(contributionLevel(1, 10)).toBe(1);
    expect(contributionLevel(3, 10)).toBe(2);
    expect(contributionLevel(5, 10)).toBe(3);
    expect(contributionLevel(10, 10)).toBe(4);
  });

  it("never returns a level above 4 even if count somehow exceeds max", () => {
    expect(contributionLevel(15, 10)).toBe(4);
  });

  it("gives any nonzero count at least level 1, even far below the max", () => {
    expect(contributionLevel(1, 1000)).toBe(1);
  });
});

describe("totalForWindow", () => {
  it("sums contribution counts across every day in every week", () => {
    const weeks = [
      { contributionDays: [{ date: "2026-01-01", weekday: 4, contributionCount: 2 }] },
      {
        contributionDays: [
          { date: "2026-01-02", weekday: 5, contributionCount: 0 },
          { date: "2026-01-03", weekday: 6, contributionCount: 3 },
        ],
      },
    ];
    expect(totalForWindow(weeks)).toBe(5);
  });

  it("is 0 for no weeks", () => {
    expect(totalForWindow([])).toBe(0);
  });
});

describe("buildYearWindow", () => {
  it("spans exactly one year ending on the reference date", () => {
    const { from, to } = buildYearWindow("2026-09-05", 0);
    expect(to).toBe("2026-09-05T23:59:59.999Z");
    expect(from).toBe("2025-09-06T00:00:00.000Z");
  });

  it("shifts a full year back per offset", () => {
    const { from, to } = buildYearWindow("2026-09-05", 1);
    expect(to).toBe("2025-09-05T23:59:59.999Z");
    expect(from).toBe("2024-09-06T00:00:00.000Z");
  });
});

function week(firstDate: string): { contributionDays: { date: string; weekday: number; contributionCount: number }[] } {
  return { contributionDays: [{ date: firstDate, weekday: 0, contributionCount: 0 }] };
}

describe("computeMonthLabels", () => {
  it("labels the first week and every week where the month changes", () => {
    const weeks = [week("2026-08-30"), week("2026-09-06"), week("2026-09-13"), week("2026-09-20")];
    expect(computeMonthLabels(weeks)).toEqual([
      { weekIndex: 0, label: "Aug" },
      { weekIndex: 1, label: "Sep" },
    ]);
  });

  it("returns one label per distinct month, in week order", () => {
    const weeks = [week("2026-01-05"), week("2026-01-12"), week("2026-02-02"), week("2026-03-02")];
    expect(computeMonthLabels(weeks)).toEqual([
      { weekIndex: 0, label: "Jan" },
      { weekIndex: 2, label: "Feb" },
      { weekIndex: 3, label: "Mar" },
    ]);
  });

  it("returns an empty array for no weeks", () => {
    expect(computeMonthLabels([])).toEqual([]);
  });

  it("skips a week with no days rather than crashing", () => {
    expect(computeMonthLabels([{ contributionDays: [] }, week("2026-01-05")])).toEqual([
      { weekIndex: 1, label: "Jan" },
    ]);
  });
});
