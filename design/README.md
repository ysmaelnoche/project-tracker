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

**"Register a project" → "Lay a new keel"**: the mockup's create-project copy
("Register a project.", "+ REGISTER PROJECT", the "Registered." standby-stage note
on Access) was generic form-speak, at odds with the rest of the console's shipyard
vocabulary (FLEET, BUILD, DEPLOYED, DECOMM). Renamed the *action* of creating a
project to "lay a keel" — real shipbuilding term for the formal, ceremonial start of
a new hull's construction record, which is exactly what the pending/STANDBY stage
already represents here (registered, but development not yet under way). Deliberately
not "build a ship": "BUILD" is already the in-development lifecycle stage elsewhere in
this app (`StageBadge`, `startDevelopment`'s "BUILD INITIATED" log entry), so reusing
it for project *creation* would collide with that meaning. The jargon heading on
`/projects/new` carries a plain-English subtitle under it ("Shipyard-speak for
'register a new project.'") so the term is never opaque on its own. `QuickCreate`'s
shared "// NEW RECORD" menu header was left alone — it covers task-creation entries
too, not just projects, so it stays generic rather than borrowing a project-only term.

**Linking a repository at project creation**: the mockup (and, until now, this app)
only let a repository be connected from an existing project's Source panel — a
schema constraint, not just a UI gap (`repositories.project_id` is `not null unique`,
so a repository row can't exist before its project does). Added an optional
"REPOSITORY (OPTIONAL)" field to the create-project form instead: the project is
always created first, then, if a slug was given, the same connect logic the Source
panel uses (`lib/github/actions.ts`'s `linkRepository`, factored out of
`connectRepository`) runs against the new project's id. A bad slug or unreachable repo
never undoes the project — it lands the operator on the new project's page with the
reason shown right next to the same connect form, ready to retry. That same connect
form also now accepts a pasted GitHub URL, not just the bare `owner/repo` slug it
originally demanded (`lib/github/slug.ts`'s `parseRepoSlug`) — pasting the repo's
actual URL is the more natural thing to do and was silently failing before.

**A sci-fi "buffering" system, not in the mockup at all**: several mutating actions
(creating a project, saving an edit, connecting a repository, creating a task) had
either no pending indicator at all or a plain spinner + static text — nothing tied to
this app's HUD aesthetic, and nothing as satisfying as the Access screen's staged
"AUTHENTICATING" sequence. Generalized that sequence's engine out of
`lib/auth/auth-sequence.ts` into `lib/ui/sequence.ts` (same public API, so
`AccessForm` needed zero changes) and built a shared `components/ui/BufferPanel.tsx`
around it. Every CRUD write plays its own staged sequence through the same
mechanism, with its own copy — a distinct concept from sign-in's identity handshake,
not a reskin of it: "COMMITTING" (writing a project/task record) and "LINKING"
(a live GitHub round trip) instead of "AUTHENTICATING", ending in a payoff specific
to what happened ("KEEL LAID", "ENTRY QUEUED", "UPLINK ESTABLISHED"). Lighter-weight
actions (toggles, saves, disconnects) got a cheaper upgrade instead: `Spinner` became
a small counter-rotating twin-ring reticle, and `ConfirmDialog` gained a `pending`
state so its own confirm button reflects an in-flight Server Action rather than
sitting inert. Also fixed in the same pass: the Access screen's own line-reveal
animation referenced a CSS keyframe, `inject`, that was never actually defined — that
effect had been silently inert since the screen was built.

**SCUTTLE — permanently deleting a project**: not in the mockup at all (which has no
concept of permanent deletion — "Nothing was deleted" is the app's whole existing
philosophy for DECOMMISSION). Added at the user's explicit request. First built as a
"PURGE" action gated behind a 14-day waiting period after decommissioning, then
redesigned once the user saw it: no waiting period at all — instead, real operator
confirmation stacked twice before anything destructive happens, reachable from either
of the two moments that make sense:

- From an **already-decommissioned** project's own page: **RESTORE** and **☠ SCUTTLE**
  sit side by side — the two things you can actually do with something already retired.
- From an **active** project: the DECOMMISSION confirmation dialog itself carries a
  small "☠ scuttle the ship instead — skip decommissioning" link below its normal
  buttons (`ConfirmDialog`'s new `dangerLabel`/`onDanger` props) — a quiet escape
  hatch, not a third equally-weighted button, for destroying a project outright
  without archiving it first.

Both paths converge on the same two-step confirmation: a plain `ConfirmDialog`
("Scuttle {name}?", tone red) asking for real confirmation, then
`components/projects/ScuttleSequence.tsx` — a large 5-4-3-2-1 countdown with an ABORT
button that auto-proceeds if not stopped, handing off into the same staged-buffer
mechanism every other CRUD write uses on the way to the actual delete. Named
"scuttle" (the real nautical term for deliberately sinking your own ship) rather than
mixing it with the generic "purge" — every other lifecycle action in this app uses one
consistent word end-to-end (DEPLOY → "DEPLOYED", DECOMMISSION → "DECOMMISSIONED"), so
this one does too (button, both dialogs, the countdown, and the "SCUTTLED" activity-log
entry). "PURGE" stays exactly as it was for deleting a *task* — a different, unrelated
entity, deliberately still its own word. `scuttleProject` (`lib/projects/actions.ts`)
only ever deletes this app's own `projects` row (which FK-cascades to its tasks,
notes, links, and repository/sync-history rows); it never calls the GitHub API, so
the repository on GitHub itself is completely untouched. `archived_at` (set by
`archiveProject`, cleared by `restoreProject`) is kept as a plain historical fact —
when a project was decommissioned — even though nothing gates on it anymore. Requires
`supabase/migrations/0005_project_purge.sql`.
