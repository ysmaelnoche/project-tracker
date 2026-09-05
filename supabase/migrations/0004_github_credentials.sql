-- Lets the operator paste a GitHub personal access token into the Config
-- screen instead of only setting GITHUB_TOKEN as a server env var. Kept in
-- its own table (not automation_settings) so a secret isn't mixed into what
-- is otherwise a plain preferences row. See lib/github/token-source.ts for
-- how this and the env var are reconciled (database always wins when set).

create table if not exists github_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null check (char_length(trim(token)) > 0),
  updated_at timestamptz not null default now()
);

create trigger github_credentials_set_updated_at
  before update on github_credentials
  for each row execute function set_updated_at();

-- See 0003_grants.sql's header comment: the SQL editor doesn't reliably
-- apply Supabase's usual auto-grant, so every new table needs this explicit.
grant select, insert, update, delete on public.github_credentials
  to anon, authenticated, service_role;

alter table github_credentials enable row level security;

create policy "github_credentials_owner_all" on github_credentials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
