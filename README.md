# Shipyard

Shipyard is a personal project & task tracker. It's built for one person to keep track of
their own projects — personal and work — the tasks under each one, plus any standalone
to-dos, all pulled together into one "what's next" view. Connect a GitHub repository to a
project and its page will also show real commits, branches, and pull requests, so you can
see what actually happened, not just what's on your list.

It's **not** a shared app with logins for lots of people — there are no accounts, teams, or
organizations. Everyone who sets this up gets their own private copy, with their own
database, and one login they create for themselves. This guide walks through setting up
your own copy from scratch, one step at a time — **no coding experience required.**

> Already comfortable with Node, Git, and Supabase? Skip to [For developers](#for-developers)
> for the condensed version.

## Contents

- [What you'll need before you start](#what-youll-need-before-you-start)
- [Setup, step by step](#setup-step-by-step)
- [Putting it online (optional)](#putting-it-online-optional)
- [If something goes wrong](#if-something-goes-wrong)
- [For developers](#for-developers)

## What you'll need before you start

Everything here is free. Install these before starting Step 1 below.

1. **Node.js**, version 20 or newer — this is the program that runs the app on your computer.
   - Go to **[nodejs.org](https://nodejs.org)** and download the version labeled **LTS**
     (this means "the stable one" — always pick LTS, not "Current").
   - Run the installer and click through with the default settings.
2. **A free Supabase account** — **[supabase.com](https://supabase.com)**. This is where your
   projects and tasks actually get stored. Click **Start your project** and sign up (GitHub
   sign-in is quickest).
3. **A free GitHub account** — **[github.com](https://github.com)** — to make your own copy
   of this project's code. You're probably already signed in if you're reading this there.
4. **Visual Studio Code** (recommended) — **[code.visualstudio.com](https://code.visualstudio.com)**.
   A free editor that makes copying the code to your computer much easier with no prior
   command-line experience. This guide assumes you're using it; if you already know Git and
   prefer the command line, that still works fine too.

Two more things, both **optional** and covered later, not needed to get started:

- A GitHub *personal access token*, only if you want a project's page to show its real
  commits/pull requests.
- A free **[Vercel](https://vercel.com)** account, only if you want to put your copy online
  instead of just running it on your own computer.

### What's a "terminal"?

A few steps below ask you to type a command into a **terminal** (also called "command line").
It's a plain text window where you type instructions instead of clicking buttons — every
command you'll need is written out exactly below, so you just copy it and press Enter.

- **In VS Code** (what this guide uses): open the menu **Terminal → New Terminal**. A
  terminal opens at the bottom of the window, already pointed at the right folder.
- **Windows, without VS Code**: search for "PowerShell" in the Start menu and open it.
- **Mac, without VS Code**: open **Terminal** from Applications → Utilities.

## Setup, step by step

### Step 1 — Get your own copy of the code

1. Open this project on GitHub: **[github.com/ysmaelnoche/project-tracker](https://github.com/ysmaelnoche/project-tracker)**.
2. Click **Fork** near the top-right of the page. This creates your own personal copy under
   your own GitHub account, completely separate from the original — you can change anything
   in it without affecting anyone else.
3. On the fork's page that opens, click the green **Code** button and copy the URL shown
   (it looks like `https://github.com/YOUR-USERNAME/project-tracker.git`).
4. In VS Code, press **Ctrl+Shift+P** (Mac: **Cmd+Shift+P**) to open the Command Palette,
   type **Git: Clone**, press Enter, then paste the URL you just copied. Choose a folder to
   save it in (e.g. your Desktop). When VS Code asks whether to open the cloned repository,
   click **Open**.

You now have your own copy of the code, open in VS Code.

### Step 2 — Install the project's building blocks

Open a terminal in the project folder (**Terminal → New Terminal** in VS Code) and run:

```bash
npm install
```

This downloads everything the app depends on to run. It can take a minute or two, and a lot
of text will scroll by — that's normal. You're done when you see a blank prompt again with
no errors in red.

### Step 3 — Create your database (Supabase)

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** and sign in.
2. Click **New Project**.
3. Fill in:
   - **Name**: anything you like, e.g. "Shipyard".
   - **Database Password**: choose a strong one and save it somewhere safe (a password
     manager, a note) — you probably won't need it again, but it's good to keep.
   - **Region**: whichever is closest to you.
4. Click **Create new project**, and wait for Supabase's progress screen to finish (1–2
   minutes).

### Step 4 — Connect the app to your database

1. In your terminal, in the project folder, run:

   ```bash
   cp .env.local.example .env.local
   ```

   (On Windows, if that doesn't work, use `copy .env.local.example .env.local` instead.)

   This creates a new file called `.env.local` that holds your own private keys. It's set up
   to be ignored by Git already, so it's never accidentally shared or uploaded anywhere —
   these keys stay on your computer only.

2. In your Supabase project, go to **Project Settings** (the gear icon, bottom of the left
   sidebar) → **API**.

3. In VS Code's file list on the left, click **.env.local** to open it. Fill in each line —
   right after the `=` sign, no quotes, no spaces — using the matching value from Supabase:

   | Line in `.env.local`             | Value, from Supabase's API settings page                     |
   |-----------------------------------|----------------------------------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL=`       | **Project URL**                                                 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY=`  | The **anon** / **public** key, under "Project API keys"         |
   | `SUPABASE_SERVICE_ROLE_KEY=`      | The **service_role** key, under "Project API keys" — click "Reveal" to see it |

   Leave `GITHUB_TOKEN=` blank for now — that's Step 8, and it's optional.

4. Save the file (**Ctrl+S** / **Cmd+S**).

   ⚠️ **The `service_role` key is powerful — treat it like a password.** It has full access
   to your database. Never share it, paste it in a chat, or post it publicly. `.env.local`
   already can't be accidentally committed to Git, so as long as you only paste it there,
   it stays private.

### Step 5 — Set up the database tables

This tells your new Supabase database what tables it needs.

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. In VS Code, open the file `supabase/migrations/0001_init.sql` and copy its entire
   contents (select all with **Ctrl+A** / **Cmd+A**, then copy).
3. Paste it into the SQL Editor and click **Run**. You should see a success message at the
   bottom.
4. Repeat steps 2–3 for every other file in the `supabase/migrations` folder, running them
   **in order, one at a time**: `0002_profiles.sql`, `0003_grants.sql`,
   `0004_github_credentials.sql`, `0005_project_purge.sql`, `0006_pr_merged_at.sql` (there
   may be more by the time you read this — always run whatever's there in filename order,
   lowest number first).

Your database is ready once every file has run without errors.

### Step 6 — Create your login

There's no public sign-up page — this app is built for one person, so it only ever needs
one account: yours. You'll create it directly in Supabase's dashboard, no coding involved.

1. In Supabase, go to **Authentication → Users** (left sidebar).
2. Click **Add user** → **Create new user**.
3. Fill in:
   - **Email**: any email address works — Supabase uses it only internally, you'll never
     see or type it in the app itself.
   - **Password**: a real password, at least 8 characters — this is what you'll actually
     type in to sign in to Shipyard.
   - Check the box for **Auto Confirm User**.
4. Click **Create user**. Click into the new user you just created, and copy their
   **User UID** (a long string like `a1b2c3d4-5678-...`) — you'll need it in a moment.
5. Go to **Table Editor** (left sidebar) and open the **profiles** table.
6. Click **Insert** → **Insert row**.
7. Fill in:
   - **user_id**: paste the User UID from step 4.
   - **username**: the name you'll actually sign in with — lowercase letters, numbers, and
     underscores only, must start with a letter, 3–20 characters (e.g. `ysmael`).
8. Click **Save**.

Remember the **username** and **password** you just set — that's your sign-in.

### Step 7 — Run the app

1. In your terminal, in the project folder, run:

   ```bash
   npm run dev
   ```

2. Wait until it prints something like `Ready in ...` with a `Local: http://localhost:3000`
   line.
3. Open that address, **[http://localhost:3000](http://localhost:3000)**, in your web
   browser.
4. Sign in with the username and password from Step 6.

You're in — this is your own private copy of Shipyard, running on your computer, backed by
your own database.

To stop it, click back into the terminal and press **Ctrl+C**. To start it again another
day, open the project folder in VS Code and run `npm run dev` again.

### Step 8 (optional) — Connect GitHub for development activity

Skip this if you don't need it yet — every other part of the app works fully without it,
GitHub-related panels just stay empty.

1. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**.
2. Give it any name (e.g. "Shipyard") and leave the expiration as you like.
3. Under **Repository access**, choose the specific repositories you want tracked.
4. Under **Permissions → Repository permissions**, set these four to **Read-only**:
   **Contents**, **Metadata**, **Pull requests**, **Checks**. Leave everything else as
   **No access**.
5. Click **Generate token**, then copy it immediately — GitHub only shows it once.
6. Sign in to your running app and go to **Config → GitHub Connection**, paste the token,
   and save. (Or paste it into `GITHUB_TOKEN=` in `.env.local` instead and restart
   `npm run dev` — either works.)

## Putting it online (optional)

Once it's working on your computer, you can put it on the internet for free with Vercel, so
you can use it from your phone or anywhere else.

1. Make sure your changes are pushed to your fork on GitHub (in VS Code's Source Control
   panel — the icon that looks like branches, in the left sidebar — click **Publish
   Branch** or **Sync Changes** if you see it).
2. Go to **[vercel.com/new](https://vercel.com/new)** and sign in (GitHub sign-in is
   easiest).
3. Find your forked repository in the list and click **Import**.
4. Before clicking **Deploy**, expand **Environment Variables** and add the same values
   from your `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and optionally `GITHUB_TOKEN`. These are secrets — only
   ever add them directly in Vercel's own form, never into a file you commit.
5. Click **Deploy**. After a minute or two you'll get a live web address like
   `your-project-name.vercel.app` — your app, online, backed by your own Supabase project.

## If something goes wrong

- **`'npm' is not recognized` / `node: command not found`** — Node.js isn't installed yet,
  or your terminal was already open before you installed it. Install it from
  [nodejs.org](https://nodejs.org), then close your terminal completely and open a new one.
- **A wall of red text mentioning `Cannot find module`** — Step 2 (`npm install`) was
  skipped or didn't finish. Run `npm install` again from the project folder.
- **A blank page, or an error the moment the page loads** — double-check every line in
  `.env.local` matches Supabase exactly, with no extra spaces or quotation marks. Then stop
  the app (**Ctrl+C** in its terminal) and run `npm run dev` again — changes to
  `.env.local` only take effect after a restart.
- **"Invalid username or password" when signing in** — you need the **username** you chose
  in Step 6, not the email address. If that's not it, double-check Step 5 (all migrations
  ran successfully) and Step 6 (the `profiles` row actually saved with the right
  `user_id`) both really completed.
- **"Port 3000 is already in use"** — something else (maybe another copy of this app) is
  already running. Close it, or restart your computer, then try `npm run dev` again.
- **Still stuck?** Open an
  [issue on GitHub](https://github.com/ysmaelnoche/project-tracker/issues) describing which
  step you're on and exactly what you're seeing — a screenshot helps a lot.

---

## For developers

- Product requirements: [`PLAN.md`](./PLAN.md)
- Working conventions (worktrees, TDD, cleanup): [`CLAUDE.md`](./CLAUDE.md)
- Visual design source: [`design/`](./design) — the Claude Design mockup this app's
  screens, data model, and interaction logic were built from.
- Detailed Supabase setup (schema notes, the table-grants gotcha, an alternative
  service-role-key operator-account snippet): [`supabase/README.md`](./supabase/README.md)

### Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Tailwind CSS v4 (CSS-first theme in `app/globals.css`)
- Supabase (Postgres + Auth + Row Level Security) — see [`supabase/README.md`](./supabase/README.md)
- Auth: username + password (`lib/auth/`) — a `profiles` table maps a username to the
  underlying Supabase Auth account; Supabase itself still owns password storage/hashing.
- GitHub: read-only via a personal access token + on-demand refresh (`lib/github/`) — no
  webhooks or GitHub App; see `design/README.md` for why.
- Vitest + React Testing Library (unit/component), Playwright (e2e, scaffolded but no
  specs yet — needs a real Supabase project to run against)

### Quick setup (condensed)

```bash
git clone https://github.com/<you>/project-tracker.git
cd project-tracker
npm install
cp .env.local.example .env.local   # fill in Supabase (and optionally GitHub) values
npm run dev
```

Apply the schema by running every file in `supabase/migrations/`, in order, via the
Supabase SQL editor (or `supabase db push`), then create your operator account — see
`supabase/README.md` for both.

### Scripts

- `npm run dev` — local dev server
- `npm run build` / `npm run start` — production build / serve it
- `npm run verify` — typecheck + lint + unit tests (run this before considering any
  change done)
- `npm run test:e2e` — Playwright end-to-end tests (needs `npm run dev` reachable and
  real Supabase credentials)

### Layout

- `app/` — routes. `app/access` is the sign-in screen; everything else lives under the
  `app/(app)` group, gated by `proxy.ts` (Next's middleware-equivalent) unless signed in.
- `lib/<domain>/` — one folder per feature area (`projects`, `tasks`, `dashboard`,
  `github`, `auth`, `activity`, `palette`), each split into pure/tested logic
  (`*.ts` with a matching `tests/unit/lib/<domain>/*.test.ts`) and thin, untested
  Supabase I/O (`queries.ts`/`actions.ts`) — see any domain's files for the pattern.
- `components/<domain>/` — presentational pieces for that domain; `components/ui/` is
  shared across all of them.

### Status

Every screen in `PLAN.md` is built: Overview, Fleet, Project detail, Queue, Source
Control, Config, Event Log, plus a global command palette. All merged to `main`,
typecheck/lint/unit-tests/build green.

### Contributing

This is a personal tool built to one person's own taste (see `CLAUDE.md` for the
working conventions it was built under), not a project actively seeking contributors —
but it's open source specifically so you can fork it, run your own copy, and change it
to fit how *you* work. Issues and PRs against this repo are welcome but reviewed
casually, not on any schedule.

### License

[MIT](./LICENSE) — do whatever you'd like with it.
