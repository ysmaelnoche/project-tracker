-- Username-based sign-in: a profile row maps a unique, validated username to
-- the underlying Supabase Auth user. Signing in resolves username -> email
-- server-side, via the service-role client, before the real password check
-- runs (see lib/auth/queries.ts / lib/auth/actions.ts) — the password itself
-- is still stored and checked by Supabase Auth, never reimplemented here.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create index if not exists profiles_username_idx on profiles(username);

-- The SQL editor doesn't always apply Supabase's usual auto-grant the way its
-- Table Editor UI does — without this, every query hits "permission denied for
-- table profiles" before RLS policies even get evaluated. RLS (below) remains
-- the actual security boundary; this just lets each role attempt a query at all.
grant select, insert, update, delete on public.profiles to anon, authenticated, service_role;

alter table profiles enable row level security;

create policy "profiles_owner_all" on profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
