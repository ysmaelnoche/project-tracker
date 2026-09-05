import "server-only";
import { getGithubClient } from "@/lib/github/client";
import { toFriendlyGithubError } from "@/lib/github/errors";
import { buildYearWindow, type ContributionCalendar, type ContributionResult } from "@/lib/github/contributions";

/**
 * The operator's real, whole-account GitHub contribution calendar — the same
 * data github.com's own profile graph is built from (`viewer.contributionsCollection`
 * over GraphQL), not our own commit cache. Deliberately NOT sourced from
 * `gh_commits`: that table only ever holds the most recent ~30 commits per
 * synced repo (see lib/github/sync.ts), which would make for a sparse, gappy
 * heatmap — GitHub's own calendar already covers every repo, not just the
 * ones connected here, and already has the right shape.
 */

const CALENDAR_QUERY = `
  query($from: DateTime!, $to: DateTime!) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
            }
          }
        }
      }
    }
  }
`;

interface CalendarQueryResponse {
  viewer: { contributionsCollection: { contributionCalendar: ContributionCalendar } };
}

/**
 * `yearOffset` 0 = the last 12 months, 1 = the 12 months before that, etc. —
 * feeds the Dashboard's year-back/forward filter. Requires the account-level
 * read permission a fine-grained token needs for the operator's own profile
 * activity — a repo-scoped Contents/Metadata/PR-read token alone may not be
 * enough; a permission failure here surfaces as a friendly, actionable
 * message rather than breaking the Dashboard (same rule as every other
 * GitHub call in this app).
 */
export async function getContributionCalendar(yearOffset: number): Promise<ContributionResult> {
  const octokit = await getGithubClient();
  if (!octokit) {
    return {
      ok: false,
      notConfigured: true,
      error: "Connect a GitHub token in Config to see your contribution history.",
    };
  }

  const { from, to } = buildYearWindow(new Date().toISOString().slice(0, 10), yearOffset);

  try {
    const response = await octokit.graphql<CalendarQueryResponse>(CALENDAR_QUERY, { from, to });
    return { ok: true, calendar: response.viewer.contributionsCollection.contributionCalendar };
  } catch (error) {
    return { ok: false, error: toFriendlyGithubError(error) };
  }
}
