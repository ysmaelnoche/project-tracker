import { describe, expect, it } from "vitest";
import { toFriendlyTaskError } from "@/lib/tasks/errors";

describe("toFriendlyTaskError", () => {
  it("returns a generic message for null/undefined errors", () => {
    expect(toFriendlyTaskError(null)).toMatch(/\w/);
    expect(toFriendlyTaskError(undefined)).toMatch(/\w/);
  });

  it("recognizes the pending-project trigger by Postgres check_violation code", () => {
    const message = toFriendlyTaskError({ code: "23514", message: "raw db internals should not leak" });
    expect(message).toContain("Development hasn't started yet");
    expect(message).not.toContain("raw db internals");
  });

  it("recognizes the pending-project trigger by message content even without the code", () => {
    const message = toFriendlyTaskError({
      message: "Cannot create or move a task onto a project that has not started development yet (project abc).",
    });
    expect(message).toContain("Development hasn't started yet");
  });

  it("never leaks the raw Postgres exception text for unrelated errors", () => {
    const raw = "duplicate key value violates unique constraint \"tasks_ref_key\"";
    const message = toFriendlyTaskError({ code: "23505", message: raw });
    expect(message).not.toContain(raw);
    expect(message).not.toContain("constraint");
  });
});
