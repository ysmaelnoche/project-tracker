import type { ProjectStatus } from "@/lib/types";

const STAGE: Record<ProjectStatus, { label: string; mark: string; className: string }> = {
  pending: { label: "STANDBY", mark: "○", className: "text-ink-faint" },
  in_development: { label: "BUILD", mark: "●", className: "text-amber" },
  production: { label: "DEPLOYED", mark: "◈", className: "text-teal" },
  paused: { label: "HOLD", mark: "◐", className: "text-ink-3" },
  archived: { label: "DECOMM", mark: "×", className: "text-ink-faint" },
};

export function StageBadge({ status }: { status: ProjectStatus }) {
  const s = STAGE[status];
  return (
    <span className={`font-mono text-[9px] tracking-[0.14em] ${s.className}`}>
      {s.mark} {s.label}
    </span>
  );
}

export function stageLabel(status: ProjectStatus) {
  return STAGE[status].label;
}
