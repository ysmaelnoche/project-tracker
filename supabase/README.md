# Supabase setup

1. Create a project at https://supabase.com/dashboard (or use an existing one).
2. Copy **Project Settings → API → Project URL / anon public key / service_role key**
   into `.env.local` (see `.env.local.example` for the exact variable names).
3. Apply the schema: open the SQL editor in the Supabase dashboard and run the contents
   of `migrations/0001_init.sql` (or, with the Supabase CLI installed and linked to the
   project: `supabase db push`).
4. Enable email auth (Authentication → Providers → Email) and turn on "magic link" /
   OTP sign-in — the app has one operator and signs in with an email link, no password.
5. Optional, for GitHub activity: create a fine-grained personal access token
   (read-only: Contents, Metadata, Pull requests) and put it in `GITHUB_TOKEN` in
   `.env.local`. The app works fully without it — repository/commit/PR panels just stay
   in their empty state until a token and a repository are connected.

Migrations are plain numbered SQL files under `migrations/`. Add new ones as
`00XX_description.sql` rather than editing an already-applied file.
