## 1. Context re-entry (the context-switching fix)

When you're juggling several agents at once, every summary an agent hands you is a cold start for *you*. This block makes agents write for that. It lives in my root instruction file, shared across all repositories.

```markdown
## Context re-entry (multi-project juggling)

I am juggling several projects, each with several concurrent sessions, and have usually lost
the thread by the time I return to any one of them. Write every user-facing message for cold
re-entry — assume I remember nothing from the scrollback:

- **Open with a recap.** Before any summary, decision point, or question: 2–3 plain sentences on
  what we were just working on, why, and where it stands now.
- **Plain language.** No invented codenames, abbreviations, or callbacks like "the earlier fix"
  or "option B from before" — restate the thing in place, every time.
- **Self-contained questions.** When asking me to decide something, the question itself
  must carry everything needed to answer it: the background, the options, the tradeoffs, and
  your recommendation. Never require scrolling back.
- **One question at a time.** When a summary or decision point holds several open questions or
  next steps, say so up front ("three decisions are waiting; here's the first"), then present
  only the first and wait for the answer before raising the next. Never dump them all at once —
  it's too much mental load.
- **Anchor the work.** Name the project, branch, and PR when reporting status — several other
  sessions look just like this one.
- **End with the next action.** Close long updates with the single thing waiting on me,
  or say explicitly that nothing is.
```

## 2. Git worktrees for parallel agents

```markdown
## Worktrees

When starting any new feature or fix, begin by creating a separate git worktree from the base
branch and do all work inside it, so parallel agents never overwrite each other's changes.
After the work is merged, clean up by removing the worktree. For the next task, create a fresh
worktree from the latest base branch — don't reuse old trees.
```

## 3. TDD is mandatory

```markdown
## TDD is mandatory

Every change follows **failing test first → implement → verify**:
1. Write the test(s) that capture the desired behavior and watch them **fail** (red).
2. Implement the minimum to make them pass.
3. Run the suite + typecheck and confirm green.

Don't write implementation before a failing test exists. When fixing a bug, reproduce it with a
failing test first.

## Verify before claiming "done"

Never report something as working without running it. "Done" means: relevant tests green,
typecheck clean, and — for user-facing flows — exercised end to end (e.g. Playwright for web
flows). If tests fail or a step was skipped, say so plainly with the output.
```

## 4. Builder/driver split for the no-mistakes gate (the token optimization)

This is the optimization from the live session: the agent that *built* a feature is sitting on a huge context (often 150k–200k tokens). If that same agent drives the review gate — which takes many turns of monitoring and simple responses — that entire context is resent on every turn. Instead, the builder hands off, and a fresh, cheap, tiny-context agent drives the gate. A park→decide→resume roundtrip costs ~30k tokens on a driver vs ~200k on a builder.

Adapt to your setup; mine targets the [no-mistakes gate](https://github.com/kunchenguid/no-mistakes).

```markdown
## Orchestrating the gate (builder/driver split)

- **Builders never drive the gate.** A builder agent builds, commits on its branch, and ends its
  task with a `HANDOFF: INTENT` paragraph — a thorough statement of what changed and why, for
  the reviewer. Its large transcript is read once and never resumed for gate-driving.
- **A fresh tiny driver agent per worktree** (cheap model, few-k-token context) runs the gate:
  it starts the review with the handed-off intent, monitors progress, and answers the gate's
  questions.
- **Gate rules for the driver:** apply auto-fixable findings; approve info-only findings; for
  anything that needs a human decision, PARK — quote the finding verbatim and end the task so
  the orchestrator can relay it to me, then resume the driver with my decision. Resume a
  builder only when a finding needs real code fixes.
- Never end a subagent's turn while a gate run is active — its background processes are
  orphaned the moment the turn ends.
```

**Bonus — cross-provider review:** having a different provider review than the one that built (e.g. Claude Code implements, Codex reviews, or vice versa) catches a different distribution of bugs, and spreads the token load across two subscriptions.

---

## 5. Cleaning up after tests and implementation (the rule that came from a broken machine)

Scratch is not the problem — *leftover* scratch is. Agents were spawning per-worktree .NET CLI
homes, and the SDK's first-run experience quietly appended one `…\.dotnet-cli\.dotnet\tools` entry
to the persistent **User** PATH per worktree. Run after run they accumulated until PATH hit
Windows' length limit and broke every terminal and tool on the machine, Claude Code included;
70+ entries had to be stripped out by hand, and a later audit still found 13 more. Nothing in that
sequence was malicious or even careless in the moment — each agent did one reasonable thing and
never looked back at it. That is exactly why it needs to be a standing rule rather than a habit.

```markdown
## Temp files, mock files, and scratch worktrees

Creating temp files, mock/fixture data and scratch worktrees during implementation or testing is
**expected and fine**. The rule is about what happens next:

- **Clean up in the same task that created it**, including on the failure path. Not "later", not
  "the next agent will". If a test throws, the cleanup still runs.
- **Scratch lives somewhere disposable** — the session scratchpad directory, or a gitignored
  folder inside the repo. Never loose in `%TEMP%`'s root, never beside source files.
- **Never write the persistent PATH.** No `setx PATH`, no
  `[Environment]::SetEnvironmentVariable(..., 'User')` or `'Machine'`. To make a tool findable,
  invoke it by full path, or set `$env:PATH` for the **current process only**.
- **Set `DOTNET_ADD_GLOBAL_TOOLS_TO_PATH=0` and `DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1`** anywhere a
  scratch `DOTNET_CLI_HOME` is used. This is the actual fix — the SDK writes that PATH entry on
  first run, so cleaning up afterwards does not prevent it. `eng/verify.ps1` already does this;
  any new script that sets `DOTNET_CLI_HOME` must too.
- **Redirect `TEMP`/`TMP` for test runs**, as `eng/verify.ps1` does. Suites that sweep a shared
  scratch directory on startup will delete each other's fixtures when two runs overlap, and it
  looks exactly like a flaky test.
- **Remove scratch worktrees once the branch is merged**: `dotnet build-server shutdown` first
  (a locked DLL blocks removal, and `VBCSCompiler`/`MSBuild` may need killing), then
  `git worktree remove`, then `git worktree prune`.
- **Never use `git stash`.** The stash is shared across worktrees, so parallel agents overwrite
  each other's work with it.
- **Delete only what you created, by exact path.** Never sweep a directory that holds other
  agents' work - `%TEMP%\orbit-wt` holds one worktree per agent, and removing it, pruning it, or
  globbing inside it destroys four other agents' uncommitted work. In one round this happened
  twice; both times the branch survived only because someone had committed first. Remove your own
  worktree by its full path and nothing beside it.
- **Report the cleanup.** Before saying a task is done, name the temp directories and worktrees
  you removed, and confirm the User PATH is unchanged — length and entry count, measured:
  `$p = [Environment]::GetEnvironmentVariable('PATH','User'); "$($p.Length) chars"`
- **Never delete anything in a real user directory. Report it instead.** Pictures, Documents,
  Desktop, Downloads and the like hold the user's own files. If cleanup seems to require deleting
  something there, you have already made a mistake worth stopping for: say what you found, where,
  and why you believe it is yours, and let the user decide. "It matches the size my test produced"
  is not proof of ownership - an agent acting on exactly that reasoning permanently deleted a
  screenshot the user had taken themselves and shared minutes earlier. Deleting from these
  directories bypasses the Recycle Bin, so there is no undo.
- **Prevention beats cleanup.** A test that can write to a real user directory is the defect; the
  stray file is only the symptom. Every path a spec touches is injected and points at a temp
  directory, so there is never anything of yours to find in `Pictures` in the first place.
- **Pass this rule on.** Every subagent you spawn gets these instructions in its brief. The
  leftovers came from subagents, so the rule has to travel with the delegation.
```
