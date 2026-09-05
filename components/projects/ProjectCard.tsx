import Link from "next/link";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { StageBadge } from "@/components/ui/StageBadge";
import { diffDays, formatStamp } from "@/lib/format";
import { projectGaugeTone } from "@/lib/projects/lifecycle";
import { computeTaskProgress } from "@/lib/projects/progress";
import type { ProjectTaskRow } from "@/lib/projects/task-reads";
import type { Project } from "@/lib/types";

function buildMetaLine(project: Project, tasks: ProjectTaskRow[], today: string): string {
  const { done, total } = computeTaskProgress(tasks);
  const bits: string[] = [total ? `${String(done).padStart(2, "0")}/${String(total).padStart(2, "0")} TASKS` : "NO TASKS"];

  if (project.devStartDate && !project.publishedDate) {
    bits.push(`T+${diffDays(project.devStartDate, today)}D`);
  }
  if (project.devStartDate) bits.push(`START ${formatStamp(project.devStartDate)}`);
  if (project.targetDate && project.status !== "production") {
    bits.push(`TARGET ${formatStamp(project.targetDate)}`);
  }
  if (project.publishedDate) bits.push(`DEPLOYED ${formatStamp(project.publishedDate)}`);

  return bits.join(" · ");
}

/** One row on the Fleet list — ref, name, class, stage, progress gauge, meta line. */
export function ProjectCard({
  project,
  tasks,
  today,
}: {
  project: Project;
  tasks: ProjectTaskRow[];
  today: string;
}) {
  const { total, percent } = computeTaskProgress(tasks);
  const gaugeWidth = project.status === "pending" ? 0 : percent;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block cursor-pointer border border-border bg-surface-raised px-[18px] py-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      <div className="flex flex-wrap items-baseline gap-3.5">
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{project.ref}</span>
        <h3 className="m-0 min-w-0 flex-1 basis-[180px] font-mono text-[15px] tracking-[0.05em] text-ink">
          {project.name.toUpperCase()}
        </h3>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {project.type === "personal" ? "PERSONAL" : "WORK"}
        </span>
        <StageBadge status={project.status} />
        <ProgressGauge
          percent={gaugeWidth}
          tone={projectGaugeTone(project.status)}
          className="w-28 flex-none"
        />
        <span className="flex-none w-11 text-right font-mono text-xs tabular-nums text-ink">
          {total ? `${percent}%` : "—"}
        </span>
      </div>
      <div className="mt-2.5 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-faint">
        {buildMetaLine(project, tasks, today)}
      </div>
    </Link>
  );
}
