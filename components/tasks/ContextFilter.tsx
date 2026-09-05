import Link from "next/link";

import { buildTaskQueueHref, TASK_CONTEXT_DEFS, type TaskContext, type TaskView } from "@/lib/tasks/views";

/** Project vs Standalone context filter, matching the reference's `ctxFilters`. */
export function ContextFilter({ active, view }: { active: TaskContext; view: TaskView }) {
  return (
    <div className="ml-auto flex flex-wrap items-center gap-3">
      {TASK_CONTEXT_DEFS.map((c) => {
        const isActive = c.key === active;
        return (
          <Link
            key={c.key}
            href={buildTaskQueueHref(view, c.key)}
            className={`font-mono text-[9px] tracking-[0.13em] ${
              isActive ? "text-amber" : "text-ink-3 hover:text-ink"
            }`}
          >
            {isActive ? "◆" : "◇"} {c.label}
          </Link>
        );
      })}
    </div>
  );
}
