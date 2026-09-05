import Link from "next/link";

import { ContextFilter } from "@/components/tasks/ContextFilter";
import { TaskQueueList } from "@/components/tasks/TaskQueueList";
import { TaskViewTabs } from "@/components/tasks/TaskViewTabs";
import { formatStamp } from "@/lib/format";
import { decorateTaskRow } from "@/lib/tasks/present";
import { listProjectsLite, listTasks } from "@/lib/tasks/queries";
import {
  bucketTasksByView,
  countsByView,
  filterTasksByContext,
  parseTaskContext,
  parseTaskView,
  sortTaskRows,
  TASK_VIEW_EMPTY_COPY,
  todayIso,
} from "@/lib/tasks/views";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; context?: string }>;
}) {
  const { view: viewParam, context: contextParam } = await searchParams;
  const view = parseTaskView(viewParam);
  const context = parseTaskContext(contextParam);
  const today = todayIso();

  const [tasks, projects] = await Promise.all([listTasks(), listProjectsLite()]);
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const contextFiltered = filterTasksByContext(tasks, context);
  const counts = countsByView(contextFiltered, today);
  const rows = sortTaskRows(bucketTasksByView(contextFiltered, view, today)).map((task) =>
    decorateTaskRow(task, task.projectId ? (projectById.get(task.projectId) ?? null) : null, today),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="font-mono text-2xl font-light tracking-[0.02em] sm:text-[32px]">QUEUE</h1>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {formatStamp(today)}
        </span>
        <Link
          href="/tasks/new"
          className="ml-auto cursor-pointer bg-amber px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-amber-hover"
        >
          + NEW TASK
        </Link>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border border-border bg-surface px-4 py-3.5">
        <TaskViewTabs active={view} context={context} counts={counts} />
        <ContextFilter active={context} view={view} />
      </div>

      <TaskQueueList rows={rows} emptyCopy={TASK_VIEW_EMPTY_COPY[view]} key={`${view}-${context}`} />
    </div>
  );
}
