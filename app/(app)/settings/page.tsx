import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ChangeUsernameForm } from "@/components/auth/ChangeUsernameForm";
import { AutomationToggle } from "@/components/github/AutomationToggle";
import { GithubTokenForm } from "@/components/github/GithubTokenForm";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { getCurrentUsername } from "@/lib/auth/queries";
import { signOutAction } from "@/lib/github/actions";
import type { AutomationSettingKey } from "@/lib/github/actions";
import { getAutomationSettings, getGithubTokenSource } from "@/lib/github/queries";

interface ToggleDef {
  key: AutomationSettingKey;
  label: string;
  detail: string;
}

// Labels/details mirror the rules implemented in `lib/github/automations.ts`
// exactly — see that file's header comment for the precise semantics.
const TOGGLE_DEFS: ToggleDef[] = [
  {
    key: "commitLinking",
    label: "COMMIT LINKING",
    detail: "Commit messages and pull request text containing TSK-#### bind to that task.",
  },
  {
    key: "branchBinding",
    label: "BRANCH BINDING",
    detail: "Branches named with TSK-#### bind to their task.",
  },
  {
    key: "firstCommitActivatesTask",
    label: "FIRST COMMIT → ACTIVE",
    detail: "A bound task moves from To Do to In Progress on its branch's first commit.",
  },
  {
    key: "prMergeClosesTask",
    label: "PR MERGED → TASK CLOSED",
    detail: "Merging a linked pull request marks its task Done.",
  },
  {
    key: "tagMarksProduction",
    label: "TAG → PRODUCTION",
    detail:
      "A v* release tag on the default branch marks the project Production. Off by default — the highest-stakes rule.",
  },
  {
    key: "staleBranchAlert",
    label: "STALE BRANCH ALERT",
    detail: "Flag a branch with no commits in the last 14 days.",
  },
  {
    key: "confirmBeforeArchive",
    label: "CONFIRM BEFORE ARCHIVE",
    detail: "Ask for confirmation before decommissioning a project.",
  },
];

/**
 * Config screen: the ship's own settings, in two groups — who commands it
 * (Operator: profile + session) and how it's rigged (Ship Systems: GitHub
 * connection + automation rules). See PLAN.md's "Main Navigation" -> Settings.
 */
export default async function SettingsPage() {
  const [settings, currentUsername, tokenSource] = await Promise.all([
    getAutomationSettings(),
    getCurrentUsername(),
    getGithubTokenSource(),
  ]);
  const githubConfigured = tokenSource !== "none";

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="m-0 font-mono text-[clamp(24px,3.4vw,32px)] font-light leading-[1.1] tracking-[0.02em] text-ink">
          CONFIG
        </h1>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {"// SHIP SETTINGS"}
        </span>
      </div>
      <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-2">
        Who commands this vessel, how it&apos;s wired to source control, and which automations
        are trusted to act on their own.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <span className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">
            {"// OPERATOR"}
          </span>

          <Panel>
            <PanelHeader>
              <PanelTitle>PROFILE</PanelTitle>
            </PanelHeader>
            <ChangeUsernameForm currentUsername={currentUsername} />
            <div className="border-t border-divider" />
            <ChangePasswordForm />
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>SESSION</PanelTitle>
            </PanelHeader>
            <form
              action={signOutAction}
              className="flex flex-wrap items-baseline gap-3 px-4 py-3.5"
            >
              <div className="flex-1">
                <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                  OPERATOR
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
                  Sign out of this device. You&apos;ll need your username and password to sign
                  back in.
                </p>
              </div>
              <button
                type="submit"
                className="cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-red hover:text-red"
              >
                SIGN OUT
              </button>
            </form>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <span className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">
            {"// SHIP SYSTEMS"}
          </span>

          <Panel>
            <PanelHeader>
              <PanelTitle>GITHUB CONNECTION</PanelTitle>
            </PanelHeader>
            <div className="flex flex-wrap items-baseline gap-3 px-4 py-3.5">
              <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                TOKEN STATUS
              </span>
              <span
                className={`font-mono text-[11px] tracking-[0.08em] ${
                  githubConfigured ? "text-teal" : "text-red"
                }`}
              >
                {githubConfigured ? "● CONFIGURED" : "○ NOT CONFIGURED"}
              </span>
              <span className="ml-auto max-w-[36ch] text-right text-xs leading-relaxed text-ink-3">
                {tokenSource === "database"
                  ? "Using the token saved below."
                  : tokenSource === "environment"
                    ? "Using GITHUB_TOKEN from the server environment."
                    : "Add a token below, or set GITHUB_TOKEN on the server, to enable repository sync."}
              </span>
            </div>
            <GithubTokenForm hasDatabaseToken={tokenSource === "database"} />
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>AUTOMATION RULES</PanelTitle>
            </PanelHeader>
            <div>
              {TOGGLE_DEFS.map((t) => (
                <AutomationToggle
                  key={t.key}
                  settingKey={t.key}
                  label={t.label}
                  detail={t.detail}
                  enabled={settings[t.key]}
                />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
