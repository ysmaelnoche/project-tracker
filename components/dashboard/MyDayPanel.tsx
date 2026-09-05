"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { toggleTaskStatus } from "@/lib/tasks/actions";
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * "My Day" (PLAN.md "My Day"): overdue + due-today tasks, complete/reopen
 * inline. Rows are pre-decorated via `decorateTaskRow` (lib/tasks/present.ts)
 * so this reads and behaves identically to a Queue row, minus delete.
 *
 * Completing goes through a confirmation first — the checkbox is a small
 * target and a stray click shouldn't silently close a task; reopening
 * (undoing a mistaken close) stays a single click.
 */
export function MyDayPanel({ rows }: { rows: TaskRowView[] }) {
  // Resync when the server hands us fresh rows after router.refresh(), same
  // pattern as components/tasks/TaskQueueList.tsx.
  const [prevRows, setPrevRows] = useState(rows);
  const [tasks, setTasks] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setTasks(rows);
  }

  const [pendingComplete, setPendingComplete] = useState<TaskRowView | null>(null);
  const [committing, setCommitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function remove(id: string) {
    setTasks((current) => current.filter((t) => t.id !== id));
  }
  function reinsert(row: TaskRowView) {
    setTasks((current) => (current.some((t) => t.id === row.id) ? current : [row, ...current]));
  }

  function handleToggle(row: TaskRowView, onSettled?: () => void) {
    remove(row.id);
    toggleTaskStatus(row.id)
      .then((result) => {
        onSettled?.();
        if (!result.ok) {
          reinsert(row);
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }
        toast.show({
          label: result.done ? "TASK COMPLETE" : "TASK REOPENED",
          message: result.done ? `"${row.title}" closed.` : `"${row.title}" is back in the queue.`,
          tone: result.done ? "teal" : "accent",
        });
        router.refresh();
      })
      .catch(() => {
        onSettled?.();
        reinsert(row);
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      });
  }

  function requestToggle(row: TaskRowView) {
    if (row.done) {
      handleToggle(row);
    } else {
      setPendingComplete(row);
    }
  }

  function confirmComplete() {
    if (!pendingComplete || committing) return;
    const row = pendingComplete;
    setCommitting(true);
    handleToggle(row, () => {
      setCommitting(false);
      setPendingComplete(null);
    });
  }

  const hasOverdue = tasks.some((t) => t.tone === "overdue");

  return (
    <div className="border border-border bg-surface">
      <div className="flex items-baseline gap-3 border-b border-border px-4 py-3.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink">TODAY / QUEUE</span>
        <span
          className={`ml-auto font-mono text-[9px] tracking-[0.14em] ${hasOverdue ? "text-red" : "text-ink-3"}`}
        >
          {pad2(tasks.length)} ITEMS
        </span>
      </div>

      {tasks.length > 0 ? (
        <div>
          {tasks.map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-2.5 border-b border-divider px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-hover"
            >
              <button
                onClick={() => requestToggle(row)}
                aria-label={row.done ? "Reopen task" : "Complete task"}
                className={`mt-px shrink-0 cursor-pointer border-0 bg-transparent p-0 font-mono text-xs leading-[1.4] tracking-[-0.04em] transition-colors ${BOX_TONE[row.tone]}`}
              >
                {row.done ? "[×]" : "[ ]"}
              </button>

              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm leading-relaxed ${row.done ? "text-ink-faint line-through" : "text-ink"}`}
                >
                  {row.title}
                </div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                  {row.ctxLabel}
                </div>
              </div>

              {row.inProgress ? (
                <span className="shrink-0 font-mono text-[9px] leading-[1.9] tracking-[0.12em] text-accent">
                  ● ACTIVE
                </span>
              ) : null}

              <span
                className={`shrink-0 font-mono text-[9px] leading-[1.9] tracking-[0.11em] ${RIGHT_TONE[row.tone]}`}
              >
                {row.rightLabel}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-[18px] py-9">
          <div className="font-mono text-[9px] tracking-[0.18em] text-teal">{"// QUEUE CLEAR"}</div>
          <div className="mt-3.5 font-mono text-lg font-light text-ink">Nothing on today.</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
            No deadlines, no alerts. Good window to push a build forward.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={pendingComplete !== null}
        tone="teal"
        eyebrow="CLOSE TASK"
        title="Mark this task complete?"
        body={
          pendingComplete
            ? `"${pendingComplete.title}" will be logged as done. You can reopen it any time.`
            : ""
        }
        confirmLabel="COMPLETE"
        cancelLabel="CANCEL"
        pending={committing}
        pendingLabel="LOGGING…"
        onConfirm={confirmComplete}
        onClose={() => {
          if (!committing) setPendingComplete(null);
        }}
      />
    </div>
  );
}
