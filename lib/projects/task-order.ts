import type { ProjectTaskRow } from "@/lib/projects/task-reads";

const STATUS_WEIGHT: Record<ProjectTaskRow["status"], number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
};

/**
 * Display order for a project's own Tasks panel (Project Detail) — open
 * tasks first (in-progress ahead of todo), completed tasks pushed to the
 * bottom regardless of when they were closed. Ties keep their original
 * order (relies on `Array.prototype.sort` being spec-stable). Pulled out of
 * the panel itself so the ordering survives an optimistic toggle without
 * reshuffling until the server confirms — see ProjectTaskList.tsx.
 */
export function sortProjectTasks(tasks: ProjectTaskRow[]): ProjectTaskRow[] {
  return tasks.slice().sort((a, b) => {
    const doneA = a.status === "done" ? 1 : 0;
    const doneB = b.status === "done" ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
  });
}
