"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { diffDays, isOverdue, relativeUpcoming } from "@/lib/format";
import { sortProjectTasks } from "@/lib/projects/task-order";
import type { ProjectTaskRow } from "@/lib/projects/task-reads";
import { toggleTaskStatus } from "@/lib/tasks/actions";

/** How long the "✓ LOGGED"/"○ REOPENED" flash sits before settling back to the plain status label. */
const FLASH_MS = 1100;
/** How long to let the flash play before pulling fresh (re-sorted) data from the server. */
const REFRESH_DELAY_MS = 900;

/**
 * The interactive part of Project Detail's Tasks panel — completing or
 * reopening a task right from its own project page, the same
 * `toggleTaskStatus` Server Action the Queue (/tasks) uses, so both surfaces
 * agree on what "done" means and log the same activity entry.
 *
 * Completing asks for confirmation first — the checkbox is a small target
 * and a stray click shouldn't silently close a task. Reopening stays a
 * single click: undoing a mistaken close should stay fast, not gated behind
 * another dialog.
 *
 * Unlike the Queue (which optimistically removes a completed row behind an
 * UNDO toast, since its default view is a *filtered working set*), this
 * panel always shows every task including finished ones — so completing one
 * here doesn't remove it, it plays a brief "committed" flash in place (a
 * pulse ring on the checkbox, the title's strikethrough animating in rather
 * than snapping on, a momentary "✓ LOGGED" label) and only actually re-sorts
 * to the bottom once the server confirms, via `router.refresh()`. Order is
 * otherwise frozen at the sort the server sent, via `sortProjectTasks`.
 */
export function ProjectTaskList({ tasks, today }: { tasks: ProjectTaskRow[]; today: string }) {
  // Resync when the server hands fresh rows (post-refresh) — the "adjust
  // state during render" pattern (see TaskQueueList), not an effect.
  const [prevTasks, setPrevTasks] = useState(tasks);
  const [order, setOrder] = useState(() => sortProjectTasks(tasks));
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setOrder(sortProjectTasks(tasks));
  }

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [flashes, setFlashes] = useState<Record<string, "done" | "reopened">>({});
  const [pendingComplete, setPendingComplete] = useState<ProjectTaskRow | null>(null);
  const [committing, setCommitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function requestToggle(task: ProjectTaskRow) {
    const isDone = overrides[task.id] ?? task.status === "done";
    if (isDone) {
      commit(task, false);
    } else {
      setPendingComplete(task);
    }
  }

  function confirmComplete() {
    if (!pendingComplete || committing) return;
    const task = pendingComplete;
    setCommitting(true);
    commit(task, true, () => {
      setCommitting(false);
      setPendingComplete(null);
    });
  }

  function commit(task: ProjectTaskRow, willBeDone: boolean, onSettled?: () => void) {
    setOverrides((cur) => ({ ...cur, [task.id]: willBeDone }));
    setFlashes((cur) => ({ ...cur, [task.id]: willBeDone ? "done" : "reopened" }));
    window.setTimeout(() => {
      setFlashes((cur) => {
        if (!(task.id in cur)) return cur;
        const next = { ...cur };
        delete next[task.id];
        return next;
      });
    }, FLASH_MS);

    toggleTaskStatus(task.id)
      .then((result) => {
        onSettled?.();
        if (!result.ok) {
          setOverrides((cur) => ({ ...cur, [task.id]: !willBeDone }));
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }
        window.setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
      })
      .catch(() => {
        onSettled?.();
        setOverrides((cur) => ({ ...cur, [task.id]: !willBeDone }));
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      });
  }

  return (
    <div>
      {order.map((task) => {
        const isDone = overrides[task.id] ?? task.status === "done";
        const overdue = isOverdue(task.dueDate, today, isDone);
        const flash = flashes[task.id];

        let rightMeta: string;
        if (flash === "done") rightMeta = "✓ LOGGED";
        else if (flash === "reopened") rightMeta = "○ REOPENED";
        else if (isDone) rightMeta = "✓ DONE";
        else if (overdue && task.dueDate) rightMeta = `⚠ OVERDUE T+${diffDays(task.dueDate, today)}`;
        else if (task.dueDate) rightMeta = relativeUpcoming(task.dueDate, today);
        else rightMeta = "—";

        return (
          <div
            key={task.id}
            className={`flex items-start gap-3 border-b border-divider px-4 py-3 transition-colors duration-700 last:border-b-0 ${
              flash === "done" ? "bg-teal/10" : flash === "reopened" ? "bg-accent/10" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => requestToggle(task)}
              aria-label={isDone ? "Reopen task" : "Complete task"}
              className={`relative mt-px cursor-pointer border-0 bg-transparent p-0 font-mono text-xs transition-colors ${
                isDone ? "text-teal" : overdue ? "text-red" : "text-ink-disabled"
              }`}
            >
              {flash ? (
                <span
                  aria-hidden
                  className="absolute -inset-1.5 rounded-full border border-current [animation:ping-ring_0.6s_ease-out]"
                />
              ) : null}
              {isDone ? "[×]" : "[ ]"}
            </button>
            <div className="min-w-0 flex-1">
              <span className="relative inline-block">
                <span className={`text-sm leading-relaxed ${isDone ? "text-ink-faint" : "text-ink"}`}>
                  {task.title}
                </span>
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-px w-full origin-left bg-ink-faint transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${isDone ? 1 : 0})` }}
                />
              </span>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-faint">{task.ref}</div>
            </div>
            {task.status === "in_progress" && !isDone ? (
              <span className="flex-none font-mono text-[9px] tracking-[0.12em] text-accent">● ACTIVE</span>
            ) : null}
            <span
              className={`flex-none font-mono text-[9px] tracking-[0.11em] transition-colors ${
                flash === "done"
                  ? "text-teal"
                  : flash === "reopened"
                    ? "text-accent"
                    : overdue
                      ? "text-red"
                      : isDone
                        ? "text-teal"
                        : "text-ink-3"
              }`}
            >
              {rightMeta}
            </span>
          </div>
        );
      })}

      <ConfirmDialog
        open={pendingComplete !== null}
        tone="teal"
        eyebrow="CLOSE TASK"
        refLabel={pendingComplete?.ref}
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
