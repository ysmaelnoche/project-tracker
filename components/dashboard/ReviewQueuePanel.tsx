import Link from "next/link";
import type { ReviewQueueRow } from "@/lib/dashboard/build-view";
import type { ChecksState, PullRequestState } from "@/lib/types";

const STATE: Record<PullRequestState, { label: string; mark: string; className: string }> = {
  draft: { label: "DRAFT", mark: "○", className: "text-ink-3" },
  open: { label: "OPEN", mark: "●", className: "text-accent" },
  review: { label: "CHANGES REQ", mark: "◐", className: "text-red" },
  merged: { label: "MERGED", mark: "◈", className: "text-teal" },
  closed: { label: "CLOSED", mark: "×", className: "text-ink-faint" },
};

const CHECKS: Record<ChecksState, { label: string; className: string }> = {
  pass: { label: "✓ CHECKS PASS", className: "text-teal" },
  fail: { label: "✕ CHECKS FAIL", className: "text-red" },
  running: { label: "◌ CHECKS RUNNING", className: "text-accent" },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * "Review Queue" (PLAN.md "GitHub Dashboard Integration"): PRs across every
 * repo that need attention. Reads `gh_pull_requests` directly — empty until
 * the GitHub slice starts syncing data, which is correct, not a bug.
 */
export function ReviewQueuePanel({ rows }: { rows: ReviewQueueRow[] }) {
  return (
    <div className="border border-border bg-surface">
      <div className="flex flex-wrap items-baseline gap-3 border-b border-border px-4 py-3.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink">REVIEW QUEUE</span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{pad2(rows.length)} ITEMS</span>
        <Link
          href="/source"
          className="ml-auto font-mono text-[9px] tracking-[0.14em] text-ink-3 hover:text-accent"
        >
          SOURCE CONTROL ▸
        </Link>
      </div>

      {rows.length > 0 ? (
        <div>
          {rows.map((row) => {
            const state = STATE[row.state];
            const checks = row.checksState ? CHECKS[row.checksState] : null;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-baseline gap-3 border-b border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-hover"
              >
                <span className="font-mono text-[10px] tracking-[0.05em] text-ink-3">#{row.number}</span>
                <span className={`font-mono text-[9px] leading-relaxed tracking-[0.13em] ${state.className}`}>
                  {state.mark} {state.label}
                </span>
                <span className="min-w-0 flex-1 basis-[180px] text-sm text-ink">{row.title}</span>
                <span className="font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-faint">
                  {row.projectRef}
                </span>
                {checks ? (
                  <span className={`font-mono text-[9px] leading-relaxed tracking-[0.12em] ${checks.className}`}>
                    {checks.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-[30px] text-[13px] leading-relaxed text-ink-3">
          No pull requests waiting on you.
        </div>
      )}
    </div>
  );
}
