import { describe, expect, it } from "vitest";
import { priorityLabel } from "@/lib/priority";

describe("priorityLabel", () => {
  it("labels low priority ROUTINE", () => {
    expect(priorityLabel("low")).toBe("ROUTINE");
  });

  it("labels medium priority STANDARD", () => {
    expect(priorityLabel("medium")).toBe("STANDARD");
  });

  it("labels high priority CRITICAL", () => {
    expect(priorityLabel("high")).toBe("CRITICAL");
  });
});
