-- Lets a decommissioned project become eligible for PURGE (permanent
-- deletion of the project record only — never anything on GitHub, see
-- lib/github/actions.ts, which purgeProject never calls) once
-- PURGE_GRACE_DAYS (lib/projects/purge.ts) have passed since it was
-- archived. `archived_at` is set by `archiveProject` and cleared by
-- `restoreProject` (see lib/projects/actions.ts), so restoring and later
-- re-archiving a project restarts its own clock.

alter table projects add column if not exists archived_at timestamptz;

-- Existing rows already in "archived" status predate this column and would
-- otherwise never become purge-eligible (archived_at stays null forever).
-- Backfill them to "now" so they start their 14-day clock from whenever
-- this migration runs, rather than being permanently exempt.
update projects set archived_at = now() where status = 'archived' and archived_at is null;

-- No new grant needed: grants are table-level (see 0003_grants.sql), and
-- the existing grant on public.projects already covers this new column.
