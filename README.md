# Project Tracker ("Shipyard")

A small, personal project & task tracker with GitHub activity visibility. Next.js +
Supabase, single operator, no accounts/teams/orgs.

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

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase (and optionally GitHub) values
npm run dev
```

Apply the database schema by running every file in `supabase/migrations/`, in order, via
the Supabase SQL editor (or `supabase db push` with the CLI), then create your operator
account — see `supabase/README.md` for both.

## Scripts

- `npm run dev` — local dev server
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
