import Link from "next/link";

import { pad2 } from "@/lib/format";
import { buildTaskQueueHref, TASK_VIEW_DEFS, type TaskContext, type TaskView } from "@/lib/tasks/views";

/**
 * Queue view tabs (Today/Inbound/Alerts/All open/Closed) with counts, matching
 * the reference's `taskViews`. Plain links so switching views is a normal
 * navigation — no client JS needed here.
 */
export function TaskViewTabs({
  active,
  context,
  counts,
}: {
  active: TaskView;
  context: TaskContext;
  counts: Record<TaskView, number>;
}) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {TASK_VIEW_DEFS.map((v) => {
        const isActive = v.key === active;
        return (
          <Link
            key={v.key}
            href={buildTaskQueueHref(v.key, context)}
            className={`font-mono text-[10px] tracking-[0.13em] ${
              isActive ? "text-accent" : "text-ink-3 hover:text-ink"
            }`}
          >
            {v.label} <span className="text-ink-faint">{pad2(counts[v.key])}</span>
          </Link>
        );
      })}
    </div>
  );
}
