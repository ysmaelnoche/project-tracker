-- Project Tracker: initial schema.
-- Single-operator app, but every row is still scoped to auth.uid() and protected by
-- Row Level Security rather than relying on frontend filtering (see PLAN.md "Data Protection").

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Human-readable, regex-bindable identifiers (PRJ-01, TSK-0001). Sequential and global —
-- this is a personal single-operator tool, so a single global sequence is simplest and
-- is what the GitHub linking regex (TSK-\d{4}) matches against in commit messages/branches/PRs.
create sequence if not exists project_ref_seq;
create sequence if not exists task_ref_seq;

create or replace function next_project_ref()
returns text as $$
  select 'PRJ-' || lpad(nextval('project_ref_seq')::text, 2, '0');
$$ language sql;

create or replace function next_task_ref()
returns text as $$
  select 'TSK-' || lpad(nextval('task_ref_seq')::text, 4, '0');
$$ language sql;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ref text not null unique default next_project_ref(),
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  type text not null check (type in ('personal', 'work')),
  status text not null default 'pending'
    check (status in ('pending', 'in_development', 'paused', 'production', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  dev_start_date date,
  target_date date,
  published_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists projects_status_idx on projects(status);

alter table projects enable row level security;

create policy "projects_owner_all" on projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Project links (repository/staging/notes links etc. — see PLAN.md "Project Information")
-- ---------------------------------------------------------------------------

create table if not exists project_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_links_project_id_idx on project_links(project_id);

alter table project_links enable row level security;

create policy "project_links_owner_all" on project_links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tasks (project tasks + standalone personal tasks — same table, project_id nullable)
-- ---------------------------------------------------------------------------

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ref text not null unique default next_task_ref(),
  project_id uuid references projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  due_time time, -- optional time-of-day, for meeting-shaped standalone tasks
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_project_id_idx on tasks(project_id);
create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_due_date_idx on tasks(due_date);

alter table tasks enable row level security;

create policy "tasks_owner_all" on tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Business rule: a project task cannot be created while its project is still Pending.
-- Enforced in the database, not just the UI (see PLAN.md "Project Task Business Rule").
create or replace function enforce_task_project_started()
returns trigger as $$
declare
  project_status text;
begin
  if new.project_id is not null then
    select status into project_status from projects where id = new.project_id;
    if project_status = 'pending' then
      raise exception 'Cannot create or move a task onto a project that has not started development yet (project %).', new.project_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_enforce_project_started
  before insert or update of project_id on tasks
  for each row execute function enforce_task_project_started();

-- ---------------------------------------------------------------------------
-- Activity log — append-only, drives the "Event Log" / Recent Activity views.
-- ---------------------------------------------------------------------------

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verb text not null,
  subject text not null,
  context_ref text,
  tone text not null default 'quiet' check (tone in ('teal', 'amber', 'quiet', 'red')),
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_id_idx on activity_log(user_id);
create index if not exists activity_log_created_at_idx on activity_log(created_at desc);

alter table activity_log enable row level security;

create policy "activity_log_owner_all" on activity_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- GitHub integration — one connected repository per project (v1 simplification;
-- PLAN.md allows multiple but doesn't require it). Read-only cache of GitHub data,
-- refreshed on demand via a personal access token (see PLAN.md "GitHub Data Strategy").
-- ---------------------------------------------------------------------------

create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null unique references projects(id) on delete cascade,
  owner text not null,
  name text not null,
  default_branch text not null default 'main',
  visibility text check (visibility in ('public', 'private')),
  last_synced_at timestamptz,
  last_push_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now()
);

create index if not exists repositories_user_id_idx on repositories(user_id);

alter table repositories enable row level security;

create policy "repositories_owner_all" on repositories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists gh_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  repository_id uuid not null references repositories(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  name text not null,
  ahead_by int not null default 0,
  behind_by int not null default 0,
  last_commit_at timestamptz,
  is_stale boolean not null default false,
  unique (repository_id, name)
);

create index if not exists gh_branches_repository_id_idx on gh_branches(repository_id);

alter table gh_branches enable row level security;

create policy "gh_branches_owner_all" on gh_branches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists gh_pull_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  repository_id uuid not null references repositories(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  number int not null,
  title text not null,
  branch text,
  state text not null check (state in ('draft', 'open', 'review', 'merged', 'closed')),
  checks_state text check (checks_state in ('pass', 'fail', 'running')),
  additions int not null default 0,
  deletions int not null default 0,
  reviewer_count int not null default 0,
  github_updated_at timestamptz,
  unique (repository_id, number)
);

create index if not exists gh_pull_requests_repository_id_idx on gh_pull_requests(repository_id);

alter table gh_pull_requests enable row level security;

create policy "gh_pull_requests_owner_all" on gh_pull_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists gh_commits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  repository_id uuid not null references repositories(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  sha text not null,
  message text not null,
  branch text,
  authored_at timestamptz not null,
  unique (repository_id, sha)
);

create index if not exists gh_commits_repository_id_idx on gh_commits(repository_id);
create index if not exists gh_commits_authored_at_idx on gh_commits(authored_at desc);

alter table gh_commits enable row level security;

create policy "gh_commits_owner_all" on gh_commits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Automation settings — one row per user, toggles for GitHub <-> task automation.
-- Defaults mirror the product decision to ship the higher-stakes rule (auto-marking
-- a project Production from a git tag) off by default.
-- ---------------------------------------------------------------------------

create table if not exists automation_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  commit_linking boolean not null default true,
  branch_binding boolean not null default true,
  first_commit_activates_task boolean not null default true,
  pr_merge_closes_task boolean not null default true,
  tag_marks_production boolean not null default false,
  stale_branch_alert boolean not null default true,
  confirm_before_archive boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger automation_settings_set_updated_at
  before update on automation_settings
  for each row execute function set_updated_at();

alter table automation_settings enable row level security;

create policy "automation_settings_owner_all" on automation_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
