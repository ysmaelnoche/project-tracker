import { describe, expect, it } from "vitest";
import { parseRepoSlug } from "@/lib/github/slug";

describe("parseRepoSlug", () => {
  it("parses a bare owner/repo slug", () => {
    expect(parseRepoSlug("ysmaelnoche/orbit-windows")).toEqual({
      owner: "ysmaelnoche",
      name: "orbit-windows",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseRepoSlug("  me/my-project  ")).toEqual({ owner: "me", name: "my-project" });
  });

  it("parses a full https GitHub URL", () => {
    expect(parseRepoSlug("https://github.com/ysmaelnoche/orbit-windows")).toEqual({
      owner: "ysmaelnoche",
      name: "orbit-windows",
    });
  });

  it("parses a GitHub URL with no protocol", () => {
    expect(parseRepoSlug("github.com/me/my-project")).toEqual({ owner: "me", name: "my-project" });
  });

  it("parses a GitHub URL with www.", () => {
    expect(parseRepoSlug("https://www.github.com/me/my-project")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("parses a GitHub URL with a trailing slash", () => {
    expect(parseRepoSlug("https://github.com/me/my-project/")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("parses a GitHub URL with a .git suffix", () => {
    expect(parseRepoSlug("https://github.com/me/my-project.git")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("parses a bare slug with a .git suffix", () => {
    expect(parseRepoSlug("me/my-project.git")).toEqual({ owner: "me", name: "my-project" });
  });

  it("takes only the first two path segments of a deep-linked URL", () => {
    expect(parseRepoSlug("https://github.com/me/my-project/tree/main/src")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("strips a query string or hash from a pasted URL", () => {
    expect(parseRepoSlug("https://github.com/me/my-project?tab=readme")).toEqual({
      owner: "me",
      name: "my-project",
    });
    expect(parseRepoSlug("https://github.com/me/my-project#readme")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("parses an SSH remote URL", () => {
    expect(parseRepoSlug("git@github.com:me/my-project.git")).toEqual({
      owner: "me",
      name: "my-project",
    });
  });

  it("rejects an empty or blank input", () => {
    expect(parseRepoSlug("")).toBeNull();
    expect(parseRepoSlug("   ")).toBeNull();
  });

  it("rejects input with no repo segment", () => {
    expect(parseRepoSlug("me")).toBeNull();
  });

  it("rejects a segment with characters GitHub names can't contain", () => {
    expect(parseRepoSlug("me/my project")).toBeNull();
  });

  it("rejects a non-GitHub URL", () => {
    expect(parseRepoSlug("https://gitlab.com/me/my-project")).toBeNull();
  });
});
