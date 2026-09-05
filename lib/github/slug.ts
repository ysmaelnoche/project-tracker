/**
 * Parses a "connect a repository" input into {owner, name}. Accepts a bare
 * `owner/repo` slug (the documented format) as well as the far more natural
 * thing to paste: a GitHub URL — with or without a protocol/`www.`, a
 * trailing slash, a `.git` suffix, extra path segments (a deep link to a
 * branch or file), or a query string/hash. Also accepts the SSH remote form
 * git tooling prints (`git@github.com:owner/repo.git`).
 *
 * Pure and dependency-free — `lib/github/actions.ts`'s `linkRepository` is
 * the only caller, gating the real Octokit lookup on this succeeding first.
 */
export interface RepoSlug {
  owner: string;
  name: string;
}

const GITHUB_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i;
const SSH_REMOTE_PATTERN = /^git@github\.com:(.+)$/i;
const SEGMENT_PATTERN = /^[\w.-]+$/;

export function parseRepoSlug(input: string): RepoSlug | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(GITHUB_URL_PATTERN);
  const sshMatch = trimmed.match(SSH_REMOTE_PATTERN);
  let path = urlMatch ? urlMatch[1]! : sshMatch ? sshMatch[1]! : trimmed;

  // Drop a query string/hash (a pasted URL may carry one) and a trailing .git.
  path = path.split(/[?#]/)[0]!.replace(/\.git$/i, "");

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [owner, name] = segments;
  if (!owner || !name || !SEGMENT_PATTERN.test(owner) || !SEGMENT_PATTERN.test(name)) return null;

  return { owner, name };
}
