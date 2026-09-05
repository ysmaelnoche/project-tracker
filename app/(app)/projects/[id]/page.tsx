import Link from "next/link";
import { notFound } from "next/navigation";
import { RepoPanel } from "@/components/github/RepoPanel";
import { LinksPanel } from "@/components/projects/LinksPanel";
import { NotesPanel } from "@/components/projects/NotesPanel";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { ProjectActivity } from "@/components/projects/ProjectActivity";
import { ProjectEditForm } from "@/components/projects/ProjectEditForm";
import { StageStrip } from "@/components/projects/StageStrip";
import { TasksPanel } from "@/components/projects/TasksPanel";
import { StageBadge } from "@/components/ui/StageBadge";
import { TrendChart } from "@/components/ui/TrendChart";
import { getProjectActivityTrend } from "@/lib/github/queries";
import { computeTaskProgress } from "@/lib/projects/progress";
import {
  getConfirmBeforeArchive,
  getProject,
  listActivityForProject,
} from "@/lib/projects/queries";
import { listTasksForProject } from "@/lib/projects/task-reads";
import { getTodayIso } from "@/lib/timezone-server";

// PLAN.md "Project Detail Experience". See the Shipyard mockup's
// `data-screen-label="Project detail"` section for the reference layout.
export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ repoError?: string }>;
}) {
  const { id } = await params;
  const { repoError } = await searchParams;

  const project = await getProject(id);
  if (!project) notFound();

  const today = await getTodayIso();

  const [tasks, activity, confirmBeforeArchive, activityTrend] = await Promise.all([
    listTasksForProject(project.id),
    listActivityForProject(project.ref),
    getConfirmBeforeArchive(),
    getProjectActivityTrend(project.id, today),
  ]);

  const { done, total, percent } = computeTaskProgress(tasks);
  const openTaskCount = total - done;

  return (
    <div>
      <Link
        href="/projects"
        className="font-mono text-[9px] tracking-[0.16em] text-ink-faint hover:text-ink"
      >
        ◂ FLEET
      </Link>

      <div className="mt-5 border border-border-strong bg-surface-raised p-[clamp(18px,2.6vw,28px)]">
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1 basis-[340px]">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                {project.ref}
              </span>
              <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                {project.type === "personal" ? "PERSONAL" : "WORK"} CLASS
              </span>
              <StageBadge status={project.status} />
            </div>
            <h1 className="mt-4 font-mono text-[clamp(26px,3.8vw,38px)] font-light leading-[1.12] tracking-[0.01em] text-ink">
              {project.name.toUpperCase()}
            </h1>
            {project.description ? (
              <p className="mt-3.5 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
                {project.description}
              </p>
            ) : null}
            <div className="mt-4">
              <ProjectEditForm project={project} key={project.updatedAt} />
            </div>
          </div>
          <div className="flex-none">
            <ProjectActions
              project={project}
              openTaskCount={openTaskCount}
              today={today}
              confirmBeforeArchive={confirmBeforeArchive}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3">
          <div className="font-mono text-[9px] tracking-[0.13em] text-ink-2">
            {total
              ? `${String(done).padStart(2, "0")} CLOSED · ${String(openTaskCount).padStart(2, "0")} OPEN`
              : "NO TASKS ON RECORD"}
          </div>
          <div className="font-mono text-[clamp(20px,2.6vw,26px)] font-light tracking-[-0.03em] tabular-nums text-ink">
            {total ? `${percent}%` : "—"}
          </div>
        </div>

        {activityTrend.hasRepo ? (
          <div className="mt-6">
            <TrendChart
              commits={activityTrend.trend.commits}
              merges={activityTrend.trend.merges}
              todayIso={today}
              meta={`${project.ref} · LAST 12 WEEKS`}
            />
          </div>
        ) : null}
      </div>

      <StageStrip project={project} today={today} />

      {/* Full-width rather than squeezed into half the grid below: SOURCE's
          own rows (PR title + meta, branch name + drift, commit message +
          author) each need real horizontal room — cramped into one column,
          every row wrapped to two lines and the whole panel read as one
          long, narrow wall of text. */}
      <div className="mt-[clamp(24px,3.5vw,34px)]">
        <RepoPanel projectId={project.id} linkError={repoError} />
      </div>

      <div className="mt-[clamp(16px,2.5vw,26px)] grid grid-cols-1 items-start gap-[clamp(16px,2.5vw,26px)] lg:grid-cols-2">
        <TasksPanel project={project} tasks={tasks} today={today} />

        <div className="flex flex-col gap-[clamp(16px,2.5vw,26px)]">
          <LinksPanel projectId={project.id} links={project.links} />
          <NotesPanel projectId={project.id} notes={project.notes} key={`notes-${project.updatedAt}`} />
          <ProjectActivity events={activity} />
        </div>
      </div>
    </div>
  );
}
