# Project Tracker ("Shipyard")

A small, personal project & task tracker with GitHub activity visibility. Next.js +
Supabase, single operator, no accounts/teams/orgs.

- Product requirements: [`PLAN.md`](./PLAN.md)
- Working conventions (worktrees, TDD, cleanup): [`CLAUDE.md`](./CLAUDE.md)
- Visual design source: Claude Design project "Project Tracker Design Concept"
  (`Shipyard.dc.html`) — dark terminal aesthetic, Azeret Mono + IBM Plex Sans,
  tokens in `app/globals.css`.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Tailwind CSS v4 (CSS-first theme in `app/globals.css`)
- Supabase (Postgres + Auth + Row Level Security) — see [`supabase/README.md`](./supabase/README.md)
- GitHub: read-only via a personal access token + on-demand refresh (no webhooks/GitHub
  App in v1 — see the decision note in `lib/github/README.md` once the GitHub slice lands)
- Vitest + React Testing Library (unit/component), Playwright (e2e)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase (and optionally GitHub) values
npm run dev
```

Apply the database schema by running the SQL in `supabase/migrations/` (in order) via
the Supabase SQL editor, or `supabase db push` with the CLI. See `supabase/README.md`.

## Scripts

- `npm run dev` — local dev server
- `npm run verify` — typecheck + lint + unit tests (run this before considering any
  change done)
- `npm run test:e2e` — Playwright end-to-end tests (needs `npm run dev` reachable and
  real Supabase credentials)

## Status

Foundation scaffold: schema, auth, design tokens, shared UI primitives, routed page
stubs. Feature slices (projects, tasks, dashboard, GitHub integration, polish) are
being built out from here — see the `TODO(... slice)` comments in `app/(app)/*/page.tsx`
for what belongs where.
