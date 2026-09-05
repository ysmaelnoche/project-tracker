-- Fixes the same gap discovered in profiles (0002): the SQL editor doesn't
-- always apply Supabase's usual auto-grant the way its Table Editor UI does,
-- so every table from 0001_init.sql has RLS policies but no base table
-- privilege — every real query hits "permission denied" before RLS is even
-- evaluated. RLS remains the actual security boundary; these grants just let
-- each role attempt a query at all.

grant select, insert, update, delete on
  public.projects,
  public.project_links,
  public.tasks,
  public.activity_log,
  public.repositories,
  public.gh_branches,
  public.gh_pull_requests,
  public.gh_commits,
  public.automation_settings
to anon, authenticated, service_role;

-- ref columns default to next_project_ref()/next_task_ref(), which call
-- nextval() on these sequences. Those functions run as SECURITY INVOKER (the
-- caller's privileges, not the definer's), so inserting a project or task
-- also needs the caller to have USAGE on the underlying sequence.
grant usage, select on sequence public.project_ref_seq, public.task_ref_seq
  to anon, authenticated, service_role;
