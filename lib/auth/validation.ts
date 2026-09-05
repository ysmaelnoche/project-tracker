/**
 * Pure, framework-agnostic validation for the username/password auth layer —
 * shared by the client-side forms (instant feedback) and the Server Actions
 * (the actual authority; client validation is never trusted on its own).
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 8;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): ValidationResult {
  const username = normalizeUsername(raw);
  if (!username) {
    return { valid: false, errors: ["Username is required."] };
  }

  const errors: string[] = [];
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    errors.push(`Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters long.`);
  }
  if (!/^[a-z]/.test(username)) {
    errors.push("Username must start with a letter.");
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errors.push("Username can only contain lowercase letters, numbers, and underscores.");
  }
  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN) {
    errors.push(`Password must be at least ${PASSWORD_MIN} characters long.`);
  }
  if (!/[a-z]/.test(password)) errors.push("Password must include a lowercase letter.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include an uppercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include a number.");
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("Password must include a symbol.");
  return { valid: errors.length === 0, errors };
}

export function passwordsMatch(a: string, b: string): boolean {
  return a === b;
}
