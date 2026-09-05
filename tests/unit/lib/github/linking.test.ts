import { describe, expect, it } from "vitest";
import {
  extractTaskRef,
  findTaskRef,
  resolveTaskEntry,
  resolveTaskId,
} from "@/lib/github/linking";
import type { TaskRefMap } from "@/lib/github/linking";

describe("extractTaskRef", () => {
  it("finds an uppercase TSK-#### reference", () => {
    expect(extractTaskRef("feat: rls policies for TSK-0102")).toBe("TSK-0102");
  });

  it("is case-insensitive but normalizes the result to uppercase", () => {
    expect(extractTaskRef("tsk-0402-ocr-fallback")).toBe("TSK-0402");
    expect(extractTaskRef("Tsk-0007 fix things")).toBe("TSK-0007");
  });

  it("finds a reference anywhere in the text, not just at the start", () => {
    expect(extractTaskRef("merge: #212 closes TSK-1234 for real")).toBe("TSK-1234");
  });

  it("returns null when there is no match", () => {
    expect(extractTaskRef("chore: bump dependency versions")).toBeNull();
  });

  it("returns null for a near-miss (wrong digit count)", () => {
    expect(extractTaskRef("TSK-12")).toBeNull();
    expect(extractTaskRef("TSK-123")).toBeNull();
    expect(extractTaskRef("TSK-12345")).toBe("TSK-1234"); // matches the first 4 digits
  });

  it("returns null for null/undefined/empty input", () => {
    expect(extractTaskRef(null)).toBeNull();
    expect(extractTaskRef(undefined)).toBeNull();
    expect(extractTaskRef("")).toBeNull();
  });

  it("does not match a bare TSK without digits or without the hyphen", () => {
    expect(extractTaskRef("TSK0102")).toBeNull();
    expect(extractTaskRef("TASK-0102")).toBeNull();
  });
});

describe("findTaskRef", () => {
  it("checks each candidate in order and returns the first match", () => {
    expect(findTaskRef(null, "no ref here", "tsk-0055-fix")).toBe("TSK-0055");
  });

  it("returns null when none of the candidates match", () => {
    expect(findTaskRef(null, "nope", undefined)).toBeNull();
  });

  it("prefers the earlier candidate when both match", () => {
    expect(findTaskRef("TSK-0001", "TSK-0002")).toBe("TSK-0001");
  });
});

describe("resolveTaskEntry / resolveTaskId", () => {
  const tasksByRef: TaskRefMap = new Map([
    ["TSK-0102", { id: "task-1", status: "todo" }],
    ["TSK-0400", { id: "task-2", status: "done" }],
  ]);

  it("resolves a ref found in the text to its task entry", () => {
    expect(resolveTaskEntry("fix TSK-0102 policies", tasksByRef)).toEqual({
      id: "task-1",
      status: "todo",
    });
  });

  it("resolves case-insensitively via the normalized ref", () => {
    expect(resolveTaskEntry("tsk-0102-rls", tasksByRef)).toEqual({
      id: "task-1",
      status: "todo",
    });
  });

  it("returns null when the ref isn't found in the text", () => {
    expect(resolveTaskEntry("no ref here", tasksByRef)).toBeNull();
  });

  it("returns null when the ref is found but doesn't match a known task", () => {
    expect(resolveTaskEntry("TSK-9999", tasksByRef)).toBeNull();
  });

  it("returns null for null/undefined text", () => {
    expect(resolveTaskEntry(null, tasksByRef)).toBeNull();
    expect(resolveTaskEntry(undefined, tasksByRef)).toBeNull();
  });

  it("resolveTaskId returns just the id", () => {
    expect(resolveTaskId("TSK-0400 merged", tasksByRef)).toBe("task-2");
    expect(resolveTaskId("no ref", tasksByRef)).toBeNull();
  });
});
