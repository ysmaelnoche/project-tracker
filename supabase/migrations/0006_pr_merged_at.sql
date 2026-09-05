-- GitHub's PR object already carries an exact `merged_at` timestamp — this
-- app was discarding it (only deriving a "merged" state from it). Needed
-- for the commit/merge trend charts (lib/github/dev-activity.ts's
-- buildActivityTrend): a real merge date to bucket by, not an
-- approximation from github_updated_at.

alter table gh_pull_requests add column if not exists merged_at timestamptz;

-- No new grant needed: grants are table-level (see 0003_grants.sql), and
-- the existing grant on public.gh_pull_requests already covers this
-- new column.
