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
    read fresh on every visit), then was dropped at the user's request along with the
    demo's "TERMINAL" (device recognition) and "CONSOLE" (build stamp) footer rows —
    those two never had real backing to begin with. The branding mark is
    "YSMAEL'S SHIPYARD" throughout (header nav, Access screen, page title), not the
    mockup's generic "SHIPYARD" — this is a named personal instance, not a product.

Everything else in the mockup (screens, data model, automation rules and their default
on/off state, copy) is the intended real behavior.
