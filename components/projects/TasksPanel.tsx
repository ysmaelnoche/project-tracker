import Link from "next/link";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { ProjectTaskList } from "@/components/projects/ProjectTaskList";
import { isTaskCreationLocked } from "@/lib/projects/lifecycle";
import { pickNextTask } from "@/lib/next-task";
import { computeTaskProgress } from "@/lib/projects/progress";
import type { ProjectTaskRow } from "@/lib/projects/task-reads";
import type { Project } from "@/lib/types";

/**
 * Shell for a project's Tasks panel — creation still only happens via the
 * "+ ADD TASK" link out to the Queue (`/tasks/new`), but completing or
 * reopening a task happens right here now too (`ProjectTaskList`), the same
 * `toggleTaskStatus` action the Queue uses. This component owns the locked
 * state, the empty state, and the "Next" pointer per PLAN.md "In Development"
 * ("see the next relevant task").
 */
export function TasksPanel({
  project,
  tasks,
  today,
}: {
  project: Pick<Project, "id" | "status">;
  tasks: ProjectTaskRow[];
  today: string;
}) {
  const locked = isTaskCreationLocked(project.status);
  const { done: doneCount, total } = computeTaskProgress(tasks);
  const next = pickNextTask(tasks);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>TASKS</PanelTitle>
        <span className="font-mono text-[9px] tracking-[0.13em] text-ink-faint">
          {total
            ? `${String(doneCount).padStart(2, "0")} / ${String(total).padStart(2, "0")} CLOSED`
            : "NO TASKS"}
        </span>
        {!locked ? (
          <Link
            href={`/tasks/new?project=${project.id}`}
            className="ml-auto font-mono text-[9px] tracking-[0.14em] text-accent hover:text-accent-hover"
          >
            + ADD TASK
          </Link>
        ) : null}
      </PanelHeader>

      {locked ? (
        <div className="m-3 border-l-2 border-accent bg-surface-hover p-[26px_18px]">
          <div className="font-mono text-[9px] tracking-[0.18em] text-accent">
            ⚠ TASK CREATION LOCKED
          </div>
          <div className="mt-3.5 font-mono text-xl font-light text-ink">
            Build hasn&apos;t started.
          </div>
          <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-2">
            Tasks unlock the moment you initiate the build — that&apos;s also when the start date
            is recorded for you.
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="px-[18px] py-[34px]">
          <div className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">
            {"// NO TASKS ON RECORD"}
          </div>
          <div className="mt-3.5 font-mono text-lg font-light text-ink">Nothing logged yet.</div>
          <p className="mb-4 mt-1.5 text-sm leading-relaxed text-ink-3">
            Break the work into the next few concrete steps.
          </p>
          <Link
            href={`/tasks/new?project=${project.id}`}
            className="inline-block border border-border-strong px-3.5 py-2.5 font-mono text-[9px] tracking-[0.13em] text-ink-2 hover:border-accent hover:text-accent"
          >
            + ADD FIRST TASK
          </Link>
        </div>
      ) : (
        <div>
          {next ? (
            <div className="flex flex-wrap items-baseline gap-3 border-b border-divider bg-surface-hover px-4 py-2.5">
              <span className="font-mono text-[9px] tracking-[0.16em] text-accent">▸ NEXT</span>
              <span className="text-sm text-ink">{next.title}</span>
            </div>
          ) : null}
          <ProjectTaskList tasks={tasks} today={today} />
        </div>
      )}

      <div className="border-t border-divider px-4 py-2.5 text-right">
        {/*
          The Queue (/tasks) filters by view/context only, not by a specific
          project — this links to the PROJECT context filter (all project
          tasks) rather than a per-project query param that doesn't exist yet.
        */}
        <Link
          href="/tasks?context=project"
          className="font-mono text-[9px] tracking-[0.13em] text-ink-3 hover:text-accent"
        >
          VIEW IN QUEUE ▸
        </Link>
      </div>
    </Panel>
  );
}
