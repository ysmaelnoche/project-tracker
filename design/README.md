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

One deliberate departure from this reference: the mockup's Settings screen describes
a GitHub App + webhooks + Edge Function pipeline as flavor text. We're building the
GitHub integration as a personal-access-token + on-demand refresh instead — see
`PLAN.md` ("GitHub Data Strategy") and the decision note in the README once the
GitHub slice lands. Everything else in the mockup (screens, data model, automation
rules and their default on/off state, copy) is the intended real behavior.
