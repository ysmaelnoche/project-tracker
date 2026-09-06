import type { TaskRowView } from "@/lib/tasks/present";

const BOX_TONE: Record<TaskRowView["tone"], string> = {
  done: "text-teal",
  overdue: "text-red",
  normal: "text-ink-disabled",
};

const RIGHT_TONE: Record<TaskRowView["tone"], string> = {
  done: "text-teal",
  overdue: "text-red",
  normal: "text-ink-3",
};

/**
 * One row in the Queue list — checkbox toggle, title, context ref/project
 * line, due/overdue/completed meta, edit, delete. Purely presentational; the
 * container owns optimistic state, toasts, and the edit/delete confirmations.
 */
export function TaskRow({
  row,
  onToggle,
  onEdit,
  onDelete,
}: {
  row: TaskRowView;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-hover">
      <button
        onClick={onToggle}
        aria-label={row.done ? "Reopen task" : "Complete task"}
        className={`mt-0.5 shrink-0 cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] leading-[1.4] tracking-[-0.04em] transition-colors ${BOX_TONE[row.tone]}`}
      >
        {row.done ? "[×]" : "[ ]"}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={`text-[15px] leading-relaxed ${row.done ? "text-ink-faint line-through" : "text-ink"}`}
        >
          {row.title}
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
          {row.ctxLabel}
        </div>
      </div>

      {row.inProgress ? (
        <span className="shrink-0 font-mono text-[9px] leading-[2.2] tracking-[0.12em] text-accent">
          ● ACTIVE
        </span>
      ) : null}

      <span
        className={`shrink-0 font-mono text-[9px] leading-[2.2] tracking-[0.11em] ${RIGHT_TONE[row.tone]}`}
      >
        {row.rightLabel}
      </span>

      <button
        onClick={onEdit}
        aria-label="Edit task"
        className="shrink-0 cursor-pointer border-0 bg-transparent px-0.5 py-0 font-mono text-[11px] leading-[2] text-ink-disabled transition-colors hover:text-accent"
      >
        ✎
      </button>

      <button
        onClick={onDelete}
        aria-label="Delete task"
        className="shrink-0 cursor-pointer border-0 bg-transparent px-0.5 py-0 font-mono text-[11px] leading-[2] text-ink-disabled transition-colors hover:text-red"
      >
        ✕
      </button>
    </div>
  );
}
