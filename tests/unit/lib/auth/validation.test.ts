import { describe, expect, it } from "vitest";
import {
  normalizeUsername,
  passwordsMatch,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  YsmaelNoche  ")).toBe("ysmaelnoche");
  });
});

describe("validateUsername", () => {
  it("accepts a normal username", () => {
    expect(validateUsername("ysmaelnoche")).toEqual({ valid: true, errors: [] });
  });

  it("accepts mixed case, normalizing before validating", () => {
    expect(validateUsername("YsmaelNoche")).toEqual({ valid: true, errors: [] });
  });

  it("accepts digits and underscores after the first letter", () => {
    expect(validateUsername("ysmael_noche_02")).toEqual({ valid: true, errors: [] });
  });

  it("rejects an empty username", () => {
    const result = validateUsername("   ");
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Username is required."]);
  });

  it("rejects a username shorter than 3 characters", () => {
    const result = validateUsername("ab");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Username must be 3–20 characters long.");
  });

  it("rejects a username longer than 20 characters", () => {
    const result = validateUsername("a".repeat(21));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Username must be 3–20 characters long.");
  });

  it("rejects a username that doesn't start with a letter", () => {
    const result = validateUsername("1ysmael");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Username must start with a letter.");
  });

  it("rejects characters outside lowercase letters, digits, and underscores", () => {
    const result = validateUsername("ysmael-noche");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Username can only contain lowercase letters, numbers, and underscores.",
    );
  });

  it("can report multiple errors at once", () => {
    const result = validateUsername("1$");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("validatePassword", () => {
  it("accepts a password meeting every rule", () => {
    expect(validatePassword("Ysmateluk8!")).toEqual({ valid: true, errors: [] });
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = validatePassword("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters long.");
  });

  it("rejects a password with no lowercase letter", () => {
    const result = validatePassword("PASSWORD1!");
    expect(result.errors).toContain("Password must include a lowercase letter.");
  });

  it("rejects a password with no uppercase letter", () => {
    const result = validatePassword("password1!");
    expect(result.errors).toContain("Password must include an uppercase letter.");
  });

  it("rejects a password with no number", () => {
    const result = validatePassword("Password!!");
    expect(result.errors).toContain("Password must include a number.");
  });

  it("rejects a password with no symbol", () => {
    const result = validatePassword("Password1");
    expect(result.errors).toContain("Password must include a symbol.");
  });

  it("reports every unmet rule at once", () => {
    const result = validatePassword("abc");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(4); // too short is separate from the missing-uppercase/number/symbol checks
  });
});

describe("passwordsMatch", () => {
  it("is true for identical strings", () => {
    expect(passwordsMatch("Ysmateluk8!", "Ysmateluk8!")).toBe(true);
  });

  it("is false for different strings", () => {
    expect(passwordsMatch("Ysmateluk8!", "Ysmateluk9!")).toBe(false);
  });
});
