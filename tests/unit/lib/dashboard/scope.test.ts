import { describe, expect, it } from "vitest";
import { parseScope, projectMatchesScope, taskMatchesScope } from "@/lib/dashboard/scope";

describe("parseScope", () => {
  it("passes through known scope values", () => {
    expect(parseScope("personal")).toBe("personal");
    expect(parseScope("work")).toBe("work");
    expect(parseScope("all")).toBe("all");
  });

  it("defaults to 'all' for missing/unknown values", () => {
    expect(parseScope(undefined)).toBe("all");
    expect(parseScope(null)).toBe("all");
    expect(parseScope("bogus")).toBe("all");
  });
});

describe("projectMatchesScope", () => {
  it("matches everything when scope is 'all'", () => {
    expect(projectMatchesScope("all", "personal")).toBe(true);
    expect(projectMatchesScope("all", "work")).toBe(true);
  });

  it("only matches the same project type otherwise", () => {
    expect(projectMatchesScope("personal", "personal")).toBe(true);
    expect(projectMatchesScope("personal", "work")).toBe(false);
    expect(projectMatchesScope("work", "work")).toBe(true);
    expect(projectMatchesScope("work", "personal")).toBe(false);
  });
});

describe("taskMatchesScope", () => {
  it("matches everything when scope is 'all', standalone included", () => {
    expect(taskMatchesScope("all", "personal")).toBe(true);
    expect(taskMatchesScope("all", "work")).toBe(true);
    expect(taskMatchesScope("all", null)).toBe(true);
  });

  it("a standalone task (no project) counts as personal for scope purposes", () => {
    expect(taskMatchesScope("personal", null)).toBe(true);
    expect(taskMatchesScope("work", null)).toBe(false);
  });

  it("otherwise matches on the parent project's type", () => {
    expect(taskMatchesScope("personal", "personal")).toBe(true);
    expect(taskMatchesScope("personal", "work")).toBe(false);
    expect(taskMatchesScope("work", "work")).toBe(true);
    expect(taskMatchesScope("work", "personal")).toBe(false);
  });
});
