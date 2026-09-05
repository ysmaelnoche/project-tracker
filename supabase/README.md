# Supabase setup

1. Create a project at https://supabase.com/dashboard (or use an existing one).
2. Copy **Project Settings → API → Project URL / anon public key / service_role key**
   into `.env.local` (see `.env.local.example` for the exact variable names).
3. Apply the schema: open the SQL editor in the Supabase dashboard and run every file
   under `migrations/` **in order** (`0001_init.sql`, then `0002_profiles.sql`, ...),
   or with the Supabase CLI installed and linked to the project: `supabase db push`.
4. Auth is username + password, not email/magic-link — see "Creating the operator
   account" below. In **Authentication → Providers → Email**, make sure the Email
   provider is enabled (it is by default); you don't need to turn on magic link/OTP.
   Under **Authentication → Sign In / Providers → Email → Password requirements**,
   consider raising the minimum password length to 8 to match the app's own
   validation (`lib/auth/validation.ts`) — defense in depth, not required.
5. Optional, for GitHub activity: create a fine-grained personal access token, scoped
   to the repos you want tracked, with these **repository permissions** (all
   read-only): Contents, Metadata, Pull requests, Checks. Either put it in
   `GITHUB_TOKEN` in `.env.local`, or paste it into **Config → GitHub Connection**
   once signed into the app (validated against GitHub before it's saved; a
   database-stored token always takes priority over the env var). The app works fully
   without either — repository/commit/PR panels, including the Dashboard's
   Development Activity panel, just stay in their empty state until a token and a
   repository are connected. No account-level permissions are needed — repository
   permissions alone (Contents, Metadata, Pull requests, Checks) cover everything the
   app reads, including from private repos.

Migrations are plain numbered SQL files under `migrations/`. Add new ones as
`00XX_description.sql` rather than editing an already-applied file.

**Every new table needs an explicit `grant` statement.** Running SQL through the
dashboard's SQL editor doesn't reliably apply Supabase's usual auto-grant the way
its Table Editor UI does — a table can end up with correct RLS policies but no base
table privilege at all, which fails as a flat "permission denied" before RLS is even
evaluated (this bit `profiles` in 0002 and, it turned out, every table in 0001 — see
0003_grants.sql). Any migration that creates a table should include:
```sql
grant select, insert, update, delete on public.<table> to anon, authenticated, service_role;
```
and, if it has a column defaulting to a sequence-backed function, also:
```sql
grant usage, select on sequence public.<sequence> to anon, authenticated, service_role;
```

## Creating the operator account

There's no public sign-up screen — this is a single-operator app. Create the one
account directly with the service-role key (Node, or the Supabase dashboard's
**Authentication → Users → Add user**, followed by inserting the matching row in
`profiles`):

```js
const { data, error } = await admin.auth.admin.createUser({
  email: "you@example.com", // used internally for recovery; never shown as your username
  password: "your password",
  email_confirm: true, // skip the confirmation email — you're creating this yourself
});
// then: insert into profiles (user_id, username) values (data.user.id, 'yourusername');
```

There is no self-serve "forgot password" flow (that would need the email/redirect-URL
setup this app deliberately dropped in favor of a real sign-in screen). If you forget
the password, reset it the same way — `admin.auth.admin.updateUserById(userId, { password })`.
