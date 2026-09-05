import type { GhCommit } from "@/lib/types";

/** One commit row — short SHA, message, branch/task, and a relative-ish timestamp. */
export function CommitRow({
  commit,
  repoSlug,
  projectRef,
}: {
  commit: GhCommit & { taskRef?: string | null };
  repoSlug: string;
  projectRef?: string;
}) {
  const when = new Date(commit.authoredAt);
  const whenLabel = Number.isNaN(when.getTime())
    ? "—"
    : `${when.toISOString().slice(0, 10).replaceAll("-", ".")} ${String(when.getUTCHours()).padStart(2, "0")}:${String(when.getUTCMinutes()).padStart(2, "0")}`;

  return (
    <a
      href={`https://github.com/${repoSlug}/commit/${commit.sha}`}
      target="_blank"
      rel="noreferrer"
      className="flex flex-wrap items-baseline gap-3.5 border-b border-divider px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-hover"
    >
      <span className="flex-none font-mono text-[11px] tracking-[0.04em] text-accent">
        {commit.sha.slice(0, 7)}
      </span>
      <span className="min-w-0 flex-1 basis-[220px] text-sm leading-snug text-ink">{commit.message}</span>
      <span className={`font-mono text-[9px] tracking-[0.11em] ${commit.taskRef ? "text-teal" : "text-ink-faint"}`}>
        {projectRef ? `${projectRef} · ` : ""}⎇ {commit.branch ?? "—"}
        {commit.taskRef ? ` · ${commit.taskRef}` : ""}
      </span>
      <span className="font-mono text-[9px] tracking-[0.1em] text-ink-faint">{whenLabel}</span>
    </a>
  );
}
