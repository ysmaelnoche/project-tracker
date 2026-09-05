import Link from "next/link";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { diffDays, isOverdue, relativeUpcoming } from "@/lib/format";
import { isTaskCreationLocked } from "@/lib/projects/lifecycle";
import { pickNextTask } from "@/lib/next-task";
import { computeTaskProgress } from "@/lib/projects/progress";
import type { ProjectTaskRow } from "@/lib/projects/task-reads";
import type { Project } from "@/lib/types";

const STATUS_ORDER: Record<ProjectTaskRow["status"], number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
};

/**
 * Read-only shell for a project's tasks — the Tasks slice owns creation,
 * completion, and deletion (on `/tasks`). This panel only shows the locked
 * state, an empty state, or a static list, plus a "Next" pointer per PLAN.md
 * "In Development" ("see the next relevant task").
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

  const sorted = tasks.slice().sort((a, b) => {
    const doneA = a.status === "done" ? 1 : 0;
    const doneB = b.status === "done" ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });

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
            className="ml-auto font-mono text-[9px] tracking-[0.14em] text-amber hover:text-amber-hover"
          >
            + ADD TASK
          </Link>
        ) : null}
      </PanelHeader>

      {locked ? (
        <div className="m-3 border-l-2 border-amber bg-surface-hover p-[26px_18px]">
          <div className="font-mono text-[9px] tracking-[0.18em] text-amber">
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
            className="inline-block border border-border-strong px-3.5 py-2.5 font-mono text-[9px] tracking-[0.13em] text-ink-2 hover:border-amber hover:text-amber"
          >
            + ADD FIRST TASK
          </Link>
        </div>
      ) : (
        <div>
          {next ? (
            <div className="flex flex-wrap items-baseline gap-3 border-b border-divider bg-surface-hover px-4 py-2.5">
              <span className="font-mono text-[9px] tracking-[0.16em] text-amber">▸ NEXT</span>
              <span className="text-sm text-ink">{next.title}</span>
            </div>
          ) : null}
          {sorted.map((task) => {
            const isDone = task.status === "done";
            const overdue = isOverdue(task.dueDate, today, isDone);
            let rightMeta: string;
            if (isDone) rightMeta = "✓ DONE";
            else if (overdue && task.dueDate) rightMeta = `⚠ OVERDUE T+${diffDays(task.dueDate, today)}`;
            else if (task.dueDate) rightMeta = relativeUpcoming(task.dueDate, today);
            else rightMeta = "—";

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 border-b border-divider px-4 py-3 last:border-b-0"
              >
                <span
                  className={`mt-px font-mono text-xs ${isDone ? "text-teal" : overdue ? "text-red" : "text-ink-disabled"}`}
                >
                  {isDone ? "[×]" : "[ ]"}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm leading-relaxed ${isDone ? "text-ink-faint line-through" : "text-ink"}`}
                  >
                    {task.title}
                  </div>
                  <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                    {task.ref}
                  </div>
                </div>
                {task.status === "in_progress" ? (
                  <span className="flex-none font-mono text-[9px] tracking-[0.12em] text-amber">
                    ● ACTIVE
                  </span>
                ) : null}
                <span
                  className={`flex-none font-mono text-[9px] tracking-[0.11em] ${
                    overdue ? "text-red" : isDone ? "text-teal" : "text-ink-3"
                  }`}
                >
                  {rightMeta}
                </span>
              </div>
            );
          })}
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
          className="font-mono text-[9px] tracking-[0.13em] text-ink-3 hover:text-amber"
        >
          VIEW IN QUEUE ▸
        </Link>
      </div>
    </Panel>
  );
}
