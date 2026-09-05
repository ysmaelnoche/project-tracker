import Link from "next/link";
import { notFound } from "next/navigation";
import { LinksPanel } from "@/components/projects/LinksPanel";
import { NotesPanel } from "@/components/projects/NotesPanel";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { ProjectActivity } from "@/components/projects/ProjectActivity";
import { ProjectEditForm } from "@/components/projects/ProjectEditForm";
import { StageStrip } from "@/components/projects/StageStrip";
import { TasksPanel } from "@/components/projects/TasksPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { StageBadge } from "@/components/ui/StageBadge";
import { projectGaugeTone } from "@/lib/projects/lifecycle";
import { computeTaskProgress } from "@/lib/projects/progress";
import {
  getConfirmBeforeArchive,
  getProject,
  listActivityForProject,
} from "@/lib/projects/queries";
import { listTasksForProject } from "@/lib/projects/task-reads";

// PLAN.md "Project Detail Experience". See the Shipyard mockup's
// `data-screen-label="Project detail"` section for the reference layout.
export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, activity, confirmBeforeArchive] = await Promise.all([
    listTasksForProject(project.id),
    listActivityForProject(project.ref),
    getConfirmBeforeArchive(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const { done, total, percent } = computeTaskProgress(tasks);
  const gaugeWidth = project.status === "pending" ? 0 : percent;
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
              <ProjectEditForm project={project} error={error} key={project.updatedAt} />
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

        <div className="mt-7 flex flex-wrap items-end gap-5">
          <div className="min-w-[180px] flex-1 basis-[260px]">
            <ProgressGauge percent={gaugeWidth} tone={projectGaugeTone(project.status)} />
            <div className="mt-2.5 font-mono text-[9px] tracking-[0.13em] text-ink-2">
              {total
                ? `${String(done).padStart(2, "0")} CLOSED · ${String(openTaskCount).padStart(2, "0")} OPEN`
                : "NO TASKS ON RECORD"}
            </div>
          </div>
          <div className="flex-none font-mono text-[clamp(30px,4vw,40px)] font-light tracking-[-0.03em] tabular-nums text-ink">
            {total ? `${percent}%` : "—"}
          </div>
        </div>
      </div>

      <StageStrip project={project} today={today} />

      <div className="mt-[clamp(24px,3.5vw,34px)] grid grid-cols-1 items-start gap-[clamp(16px,2.5vw,26px)] lg:grid-cols-2">
        <TasksPanel project={project} tasks={tasks} today={today} />

        <div className="flex flex-col gap-[clamp(16px,2.5vw,26px)]">
          {/* TODO(github slice): repo/PRs/branches/commits panel goes here */}
          <Panel>
            <PanelHeader>
              <PanelTitle>SOURCE</PanelTitle>
            </PanelHeader>
            <div className="p-4">
              <EmptyState
                eyebrow="NOT CONNECTED"
                title="Source — not connected yet."
                body="Connect a GitHub repository to see commits, pushes, pull requests, and development activity here."
              />
            </div>
          </Panel>

          <LinksPanel projectId={project.id} links={project.links} />
          <NotesPanel projectId={project.id} notes={project.notes} key={`notes-${project.updatedAt}`} />
          <ProjectActivity events={activity} />
        </div>
      </div>
    </div>
  );
}
