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
- **Access screen**: the mockup's Access screen is a single-field magic-link sign-in
  ("issue access link", no password). The real app uses username + password instead
  (a `profiles` table maps a username to the underlying Supabase Auth account) so a
  Change Password / Change Username profile flow is possible — see `lib/auth/`.

Everything else in the mockup (screens, data model, automation rules and their default
on/off state, copy) is the intended real behavior.
