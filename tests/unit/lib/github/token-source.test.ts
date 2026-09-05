import { describe, expect, it } from "vitest";
import { resolveGithubToken, resolveGithubTokenSource } from "@/lib/github/token-source";

describe("resolveGithubToken", () => {
  it("prefers a database-stored token over the environment variable", () => {
    expect(resolveGithubToken("db-token", "env-token")).toBe("db-token");
  });

  it("falls back to the environment variable when there's no database token", () => {
    expect(resolveGithubToken(null, "env-token")).toBe("env-token");
    expect(resolveGithubToken(undefined, "env-token")).toBe("env-token");
    expect(resolveGithubToken("", "env-token")).toBe("env-token");
    expect(resolveGithubToken("   ", "env-token")).toBe("env-token");
  });

  it("returns null when neither is set", () => {
    expect(resolveGithubToken(null, undefined)).toBeNull();
    expect(resolveGithubToken("", "")).toBeNull();
  });

  it("trims whitespace from a pasted database token", () => {
    expect(resolveGithubToken("  db-token  ", undefined)).toBe("db-token");
  });
});

describe("resolveGithubTokenSource", () => {
  it("is 'database' when a database token is set, regardless of the env var", () => {
    expect(resolveGithubTokenSource("db-token", "env-token")).toBe("database");
    expect(resolveGithubTokenSource("db-token", undefined)).toBe("database");
  });

  it("is 'environment' when only the env var is set", () => {
    expect(resolveGithubTokenSource(null, "env-token")).toBe("environment");
  });

  it("is 'none' when neither is set", () => {
    expect(resolveGithubTokenSource(null, undefined)).toBe("none");
    expect(resolveGithubTokenSource("  ", "")).toBe("none");
  });
});
