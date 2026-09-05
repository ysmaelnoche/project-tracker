/**
 * Maps a raw Octokit/HTTP error to clean, user-facing copy — mirrors
 * `lib/tasks/errors.ts`'s job for Postgres errors. Never show a raw
 * exception, status code, or stack trace to the user (PLAN.md "GitHub
 * Failure States" / "Error States"); log details server-side instead.
 *
 * Pure and dependency-free: it only inspects plain fields Octokit's
 * `RequestError` happens to carry (`status`, `response.headers`), so it's
 * fully testable with fabricated error objects — no real GitHub call needed.
 */

const GENERIC_MESSAGE =
  "GitHub activity could not be refreshed. Your project and task data are unaffected. Try again shortly.";

interface GithubLikeError {
  status?: number;
  response?: { headers?: Record<string, string> };
}

function isGithubLikeError(error: unknown): error is GithubLikeError {
  return typeof error === "object" && error !== null && "status" in error;
}

export function toFriendlyGithubError(error: unknown): string {
  if (!isGithubLikeError(error)) return GENERIC_MESSAGE;

  const { status } = error;
  const rateLimitRemaining = error.response?.headers?.["x-ratelimit-remaining"];

  if (status === 401) {
    return "GitHub token is invalid or expired. Update it in Config and try again.";
  }
  if (status === 403 && rateLimitRemaining === "0") {
    return "GitHub rate limit reached. Try refreshing again in a few minutes.";
  }
  if (status === 403) {
    return "GitHub denied access to this repository — it may have been made private. Check the token's access in Config.";
  }
  if (status === 404) {
    return "Repository not found on GitHub. It may have been deleted or renamed.";
  }
  return GENERIC_MESSAGE;
}
