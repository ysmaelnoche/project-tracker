# Design reference

`Shipyard.reference.html` is the full source of the "Project Tracker Design Concept"
Claude Design mockup (claude.ai/design/p/9f666279-e145-405f-bcbe-e6d9fdbf27df,
file `Shipyard.dc.html`) — a working prototype, not just visuals. It's the source of
truth for:

- Exact screen copy, layout, and the design token palette (also lifted into
  `app/globals.css`)
- The `class Component extends DCLogic` block near the bottom (`renderVals()`) —
  the full data model, derived fields, and interaction logic (lifecycle transitions,
  task selection, GitHub linking automations, etc.) in one place

It uses a small templating syntax (`<sc-if>`, `<sc-for>`, `{{ }}`) from the Claude
Design canvas runtime — not something to run, just read. Find your screen with:

```
grep -n 'data-screen-label="..."' design/Shipyard.reference.html
```

Screens: Overview (dashboard), Fleet (projects list), Project detail, Queue (tasks),
Source control, Log (activity), Config (settings), Access (sign-in).

Two deliberate departures from this reference:

- **GitHub integration**: the mockup's Settings screen describes a GitHub App +
  webhooks + Edge Function pipeline as flavor text. We built a personal-access-token +
  on-demand refresh instead — see `PLAN.md` ("GitHub Data Strategy") and `lib/github/`.
- **Access screen**: the mockup's Access screen went through two versions. The first
  was a single-field magic-link sign-in ("issue access link", no password); the real
  app uses username + password instead (a `profiles` table maps a username to the
  underlying Supabase Auth account) so a Change Password / Change Username profile
  flow is possible — see `lib/auth/`. The second version redesigned it into a
  two-column layout with a step-by-step "authenticating" sequence — that part was
  built faithfully (`components/auth/AccessForm.tsx`, `lib/auth/auth-sequence.ts`),
  with a few things changed because they don't have a real backing:
  - The demo's auth steps invent specific technical detail ("PASSCODE HASH VERIFIED ·
    ARGON2ID · 64MB · T=3", fake record counts) to sell the fiction, since the demo
    has no real backend. The real steps describe the same moments honestly instead
    (resolving the username, verifying the passcode, the session being established) —
    no fabricated crypto parameters or numbers we don't actually know.
  - "No password is ever stored" (accurate for magic-link) became "Supabase verifies
    your passcode — this app never stores it" (accurate for password auth: Supabase's
    managed auth schema stores the hash, this app's own code and database never do).
  - "TRUST THIS TERMINAL FOR 30 DAYS" and a "Sign in with GitHub" alternate path are
    UI-only in the demo (no session-length or OAuth-provider change behind them) —
    left out rather than shipping a toggle that does nothing.
  - "LAST SESSION" briefly existed for real (Supabase Auth's own `last_sign_in_at`,
    read fresh on every visit), then was dropped along with the demo's "TERMINAL"
    (device recognition) and "CONSOLE" (build stamp) footer rows — those two never
    had real backing to begin with. That footer spot now carries a personal
    signature line, "Ysmael's SHIPYARD", instead — the app's actual brand mark stays
    plain "SHIPYARD" everywhere else (header nav, page title).

Everything else in the mockup (screens, data model, automation rules and their default
on/off state, copy) is the intended real behavior.

**Accent color**: the mockup's amber (`#E9A94A`) became an electric HUD blue
(`#3AC0F0`, hover `#7DD8FF`) — an Iron Man/JARVIS-console feel, at the user's request.
Every reference to it is the CSS variable `--color-accent` (renamed from
`--color-amber`) and the Tailwind utilities it generates (`bg-accent`, `text-accent`,
etc.), so the whole app repainted from one token change plus a project-wide rename —
no color is hardcoded per component. Deliberately kept clearly more saturated/vivid
than `--color-teal` (success/deployed) so the two blues never read as the same color.

Fixed in the same pass: `app/globals.css` had a bare `a { color: ... }` rule
*outside* any `@layer`, which — per the CSS cascade layers spec — silently beat every
Tailwind `text-*` utility on any `<Link>`, regardless of specificity. Any button built
from a styled `<Link>` (e.g. "+ NEW PROJECT", "+ NEW TASK") had invisible label text:
same color as its own background. Moved those base resets into `@layer base` so
Tailwind's utilities (in a later layer) win as intended.

**Dashboard "Development Activity" panel** (not in the mockup at all — added at the
user's request, then reworked once): the first attempt mirrored GitHub's own
account-wide contribution calendar (`viewer.contributionsCollection` over GraphQL,
recolored blue). That API is structurally incapable of returning private-repository
activity for *any* token — confirmed as an open, unresolved GitHub platform
limitation (github.com/orgs/community/discussions/24812), not a permissions problem
on our end. Replaced entirely with `lib/github/dev-activity*` + `DevelopmentActivityPanel`:
real commits/PRs across the operator's *connected* repos (private repos included —
that path is a plain per-repo REST read, never subject to the GraphQL limitation),
shown as a 12-week bar chart plus a per-repo breakdown, styled like the rest of the
console instead of borrowing GitHub's own green-calendar look. Closer to what
`PLAN.md`'s "GitHub Dashboard Integration" section originally asked for anyway
("3 commits today, 1 open PR" style summaries) than the calendar mimicry was.
