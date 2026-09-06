# Shipyard

A small, personal project & task tracker with GitHub activity visibility — built for
one person to run their own projects (personal and work), the tasks under each one,
and standalone to-dos, with a single "what's next" view pulled together from all of
it. It reads live GitHub data (commits, branches, pull requests) for any project you
connect a repository to, so a project's page shows its actual development activity
alongside its tasks, not just a list.

It's deliberately **not** a multi-tenant SaaS — there are no accounts, teams, or
orgs. Each person who runs it gets their own private instance, backed by their own
Supabase project, with one operator account they create for themselves. Forking this
repo gives you a copy of the app; it doesn't give you a shared login.

- Product requirements: [`PLAN.md`](./PLAN.md)
- Working conventions (worktrees, TDD, cleanup): [`CLAUDE.md`](./CLAUDE.md)
- Visual design source: [`design/`](./design) — the Claude Design mockup this app's
  screens, data model, and interaction logic were built from.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Tailwind CSS v4 (CSS-first theme in `app/globals.css`)
- Supabase (Postgres + Auth + Row Level Security) — see [`supabase/README.md`](./supabase/README.md)
- Auth: username + password (`lib/auth/`) — a `profiles` table maps a username to the
  underlying Supabase Auth account; Supabase itself still owns password storage/hashing.
  No public sign-up screen — see "Creating the operator account" in `supabase/README.md`.
- GitHub: read-only via a personal access token + on-demand refresh (`lib/github/`) — no
  webhooks or GitHub App; see `design/README.md` for why.
- Vitest + React Testing Library (unit/component), Playwright (e2e, scaffolded but no
  specs yet — needs a real Supabase project to run against)

## Prerequisites

- **Node.js 20 or newer** and npm (ships with Node) — check with `node -v`.
- **A Supabase account** — [supabase.com](https://supabase.com), free tier is enough.
  This is where your data lives; nothing is shared with anyone else's fork.
- **Git**, to clone your fork.
- Optional, for GitHub activity (commits/branches/PRs on a project's page): **a
  GitHub account** you can create a personal access token from.
- Optional, to deploy your own copy: **a Vercel account** — [vercel.com](https://vercel.com),
  free tier is enough (see "Deploying your own copy" below).

## Setting up your own copy

1. **Fork this repo**, then clone your fork:

   ```bash
   git clone https://github.com/<you>/project-tracker.git
   cd project-tracker
   npm install
   ```

2. **Create a Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard),
   then copy your local env file and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

   From your Supabase project's **Settings → API**, fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Leave `GITHUB_TOKEN`
   blank for now — it's optional and covered below.

3. **Apply the database schema.** Open your Supabase project's SQL editor and run every
   file in `supabase/migrations/`, **in order** (`0001_init.sql` through the highest
   numbered one) — or, with the Supabase CLI installed and linked to your project,
   `supabase db push`. Full detail, including a real gotcha around table grants, is in
   [`supabase/README.md`](./supabase/README.md).

4. **Create your one operator account.** There's no public sign-up screen by design —
   see "Creating the operator account" in [`supabase/README.md`](./supabase/README.md)
   for the exact snippet (it takes under a minute, using the service-role key you
   already have from step 2).

5. **Run it:**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, sign in with the username/password you just created,
   and you're in.

6. **Optional — connect GitHub** for development activity on a project's page: create a
   [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
   with read-only **Contents, Metadata, Pull requests, Checks** permissions on the repos
   you want tracked, then either put it in `GITHUB_TOKEN` in `.env.local` or paste it into
   **Config → GitHub Connection** once you're signed in. Everything else works fully
   without this — GitHub-related panels just stay empty until a token and a repository
   are connected.

## Deploying your own copy (Vercel)

This app is a standard Next.js App Router project — no special server config needed.

1. Push your fork to your own GitHub, then either:
   - **Dashboard**: go to [vercel.com/new](https://vercel.com/new), import your fork,
     and deploy — Vercel auto-detects Next.js.
   - **CLI**: from the project root, `npx vercel link` (creates/links a Vercel project),
     then `npx vercel --prod` once the env vars below are set.
2. **Add the same environment variables from your `.env.local`** to the Vercel project
   (Project → Settings → Environment Variables, or `vercel env add <NAME> production`
   for each): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and optionally `GITHUB_TOKEN`. These are secrets — set
   them directly in Vercel yourself; don't put real values in any file that gets
   committed.
3. Deploy. Your app is live at `<your-project-name>.vercel.app` (or attach a custom
   domain under Project → Settings → Domains).

## Scripts

- `npm run dev` — local dev server
- `npm run build` / `npm run start` — production build / serve it
- `npm run verify` — typecheck + lint + unit tests (run this before considering any
  change done)
- `npm run test:e2e` — Playwright end-to-end tests (needs `npm run dev` reachable and
  real Supabase credentials)

## Layout

- `app/` — routes. `app/access` is the sign-in screen; everything else lives under the
  `app/(app)` group, gated by `proxy.ts` (Next's middleware-equivalent) unless signed in.
- `lib/<domain>/` — one folder per feature area (`projects`, `tasks`, `dashboard`,
  `github`, `auth`, `activity`, `palette`), each split into pure/tested logic
  (`*.ts` with a matching `tests/unit/lib/<domain>/*.test.ts`) and thin, untested
  Supabase I/O (`queries.ts`/`actions.ts`) — see any domain's files for the pattern.
- `components/<domain>/` — presentational pieces for that domain; `components/ui/` is
  shared across all of them.

## Status

Every screen in `PLAN.md` is built: Overview, Fleet, Project detail, Queue, Source
Control, Config, Event Log, plus a global command palette. All merged to `main`,
typecheck/lint/unit-tests/build green.

## Contributing

This is a personal tool built to one person's own taste (see `CLAUDE.md` for the
working conventions it was built under), not a project actively seeking contributors —
but it's open source specifically so you can fork it, run your own copy, and change it
to fit how *you* work. Issues and PRs against this repo are welcome but reviewed
casually, not on any schedule.

## License

[MIT](./LICENSE) — do whatever you'd like with it.
