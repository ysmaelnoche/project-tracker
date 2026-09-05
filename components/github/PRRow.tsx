import type { GhPullRequest } from "@/lib/types";

const STATE_META: Record<GhPullRequest["state"], { label: string; mark: string; className: string }> = {
  draft: { label: "DRAFT", mark: "○", className: "text-ink-3" },
  open: { label: "OPEN", mark: "●", className: "text-amber" },
  review: { label: "CHANGES REQ", mark: "◐", className: "text-red" },
  merged: { label: "MERGED", mark: "◈", className: "text-teal" },
  closed: { label: "CLOSED", mark: "×", className: "text-ink-faint" },
};

const CHECKS_META: Record<NonNullable<GhPullRequest["checksState"]>, { label: string; className: string }> = {
  pass: { label: "✓ CHECKS PASS", className: "text-teal" },
  fail: { label: "✕ CHECKS FAIL", className: "text-red" },
  running: { label: "◌ CHECKS RUNNING", className: "text-amber" },
};

/**
 * One pull request row — state, title, checks, diff size, task link, and a
 * link out to GitHub. PLAN.md "GitHub Scope" is explicit that this tracker
 * doesn't rebuild PR review/merge tooling — the row is read-only visibility,
 * deep interaction happens on GitHub itself.
 */
export function PRRow({
  pr,
  repoSlug,
  projectRef,
}: {
  pr: GhPullRequest & { taskRef?: string | null };
  repoSlug: string;
  projectRef?: string;
}) {
  const state = STATE_META[pr.state];
  const checks = pr.checksState ? CHECKS_META[pr.checksState] : null;

  return (
    <a
      href={`https://github.com/${repoSlug}/pull/${pr.number}`}
      target="_blank"
      rel="noreferrer"
      className="block border-b border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-hover"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-[11px] tracking-[0.06em] text-ink-3">#{pr.number}</span>
        <span className={`font-mono text-[9px] tracking-[0.14em] ${state.className}`}>
          {state.mark} {state.label}
        </span>
        <span className="min-w-0 flex-1 basis-[200px] text-sm leading-snug text-ink">{pr.title}</span>
        {checks ? (
          <span className={`font-mono text-[9px] tracking-[0.12em] ${checks.className}`}>{checks.label}</span>
        ) : null}
        <span className="font-mono text-[9px] tabular-nums tracking-[0.1em] text-ink-faint">
          +{pr.additions} −{pr.deletions}
        </span>
      </div>
      <div className="mt-2 font-mono text-[9px] tracking-[0.11em] text-ink-faint">
        {projectRef ? `${projectRef} · ` : ""}
        ⎇ {pr.branch ?? "—"} · {pr.taskRef ? `→ ${pr.taskRef}` : "UNBOUND"}
        {pr.reviewerCount > 0 ? ` · ${pr.reviewerCount} REVIEWER${pr.reviewerCount === 1 ? "" : "S"}` : ""}
      </div>
    </a>
  );
}
