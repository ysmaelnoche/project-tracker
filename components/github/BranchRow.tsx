import type { GhBranch } from "@/lib/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** One branch row — drift, bound task, last activity, and a stale flag. */
export function BranchRow({
  branch,
  repoSlug,
  projectRef,
}: {
  branch: GhBranch & { taskRef?: string | null };
  repoSlug: string;
  projectRef?: string;
}) {
  return (
    <a
      href={`https://github.com/${repoSlug}/tree/${branch.name}`}
      target="_blank"
      rel="noreferrer"
      className="flex flex-wrap items-baseline gap-3.5 border-b border-divider px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-hover"
    >
      {projectRef ? (
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{projectRef}</span>
      ) : null}
      <span className="min-w-0 flex-1 basis-[200px] font-mono text-[13px] tracking-[0.02em] text-ink">
        ⎇ {branch.name}
      </span>
      <span className="font-mono text-[10px] tabular-nums tracking-[0.06em] text-ink-3">
        ↑{pad2(branch.aheadBy)} ↓{pad2(branch.behindBy)}
      </span>
      <span className={`font-mono text-[9px] tracking-[0.12em] ${branch.taskRef ? "text-ink-2" : "text-ink-faint"}`}>
        {branch.taskRef ?? "UNBOUND"}
      </span>
      <span className="font-mono text-[9px] tracking-[0.1em] text-ink-faint">
        {branch.lastCommitAt ? new Date(branch.lastCommitAt).toISOString().slice(0, 10).replaceAll("-", ".") : "—"}
      </span>
      <span
        className={`font-mono text-[9px] tracking-[0.13em] ${branch.isStale ? "text-red" : "text-accent"}`}
      >
        {branch.isStale ? "⚠ STALE" : "● ACTIVE"}
      </span>
    </a>
  );
}
