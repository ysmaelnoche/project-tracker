import { describe, expect, it } from "vitest";
import { toFriendlyGithubError } from "@/lib/github/errors";

describe("toFriendlyGithubError", () => {
  it("maps a 401 to an invalid/expired token message", () => {
    expect(toFriendlyGithubError({ status: 401 })).toMatch(/token/i);
  });

  it("maps a 403 with an exhausted rate-limit header to a rate-limit message", () => {
    const err = { status: 403, response: { headers: { "x-ratelimit-remaining": "0" } } };
    expect(toFriendlyGithubError(err)).toMatch(/rate limit/i);
  });

  it("maps a plain 403 (no rate-limit header) to an access-denied message", () => {
    const err = { status: 403, response: { headers: { "x-ratelimit-remaining": "42" } } };
    expect(toFriendlyGithubError(err)).toMatch(/private|access|denied/i);
  });

  it("maps a 403 with no response/headers at all to an access-denied message, not a crash", () => {
    expect(toFriendlyGithubError({ status: 403 })).toMatch(/private|access|denied/i);
  });

  it("maps a 404 to a not-found/renamed message", () => {
    expect(toFriendlyGithubError({ status: 404 })).toMatch(/not found|deleted|renamed/i);
  });

  it("never returns a message mentioning raw HTTP/Octokit internals", () => {
    const err = { status: 500, message: "Internal Server Error - octokit stack trace blah" };
    const message = toFriendlyGithubError(err);
    expect(message.toLowerCase()).not.toContain("octokit");
    expect(message.toLowerCase()).not.toContain("stack trace");
  });

  it("falls back to a generic, reassuring message for anything unrecognized", () => {
    expect(toFriendlyGithubError(new Error("boom"))).toMatch(/unaffected|try again|could not/i);
    expect(toFriendlyGithubError(null)).toMatch(/unaffected|try again|could not/i);
    expect(toFriendlyGithubError(undefined)).toMatch(/unaffected|try again|could not/i);
    expect(toFriendlyGithubError("a plain string")).toMatch(/unaffected|try again|could not/i);
  });
});
