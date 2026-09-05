"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { deleteTask, toggleTaskStatus } from "@/lib/tasks/actions";
import type { TaskRowView } from "@/lib/tasks/present";
import { TaskRow } from "./TaskRow";

interface EmptyCopy {
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * Owns the Queue list's interaction state: optimistic complete/reopen with an
 * UNDO toast, and a confirm-then-purge delete flow — matching the reference's
 * `toggleTask`/`confirmDelete`. `router.refresh()` after each mutation
 * resyncs the view/context tab counts, which are computed server-side by the
 * parent page.
 */
export function TaskQueueList({
  rows,
  emptyCopy,
}: {
  rows: TaskRowView[];
  emptyCopy: EmptyCopy;
}) {
  // Resync local state when the server hands us fresh rows (after
  // router.refresh(), or a view/context navigation) — the "adjust state
  // during render" pattern, not an effect, so it can't cascade an extra
  // render (see https://react.dev/learn/you-might-not-need-an-effect).
  const [prevRows, setPrevRows] = useState(rows);
  const [tasks, setTasks] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setTasks(rows);
  }

  const [pendingDelete, setPendingDelete] = useState<TaskRowView | null>(null);
  const router = useRouter();
  const toast = useToast();

  function reinsert(row: TaskRowView) {
    setTasks((current) => (current.some((t) => t.id === row.id) ? current : [row, ...current]));
  }

  function remove(id: string) {
    setTasks((current) => current.filter((t) => t.id !== id));
  }

  function handleToggle(row: TaskRowView) {
    remove(row.id);

    toggleTaskStatus(row.id)
      .then((result) => {
        if (!result.ok) {
          reinsert(row);
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }

        if (result.done) {
          toast.show({
            label: "TASK COMPLETE",
            message: `"${row.title}" closed.`,
            tone: "teal",
            actionLabel: "UNDO",
            onAction: () => {
              reinsert(row);
              toggleTaskStatus(row.id).then(() => router.refresh());
            },
          });
        } else {
          toast.show({
            label: "TASK REOPENED",
            message: `"${row.title}" is back in the queue.`,
            tone: "amber",
          });
        }
        router.refresh();
      })
      .catch(() => {
        reinsert(row);
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      });
  }

  function confirmDelete() {
    const row = pendingDelete;
    if (!row) return;
    setPendingDelete(null);
    remove(row.id);

    deleteTask(row.id)
      .then((result) => {
        if (!result.ok) {
          reinsert(row);
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }
        toast.show({ label: "RECORD PURGED", message: `"${row.title}" removed from the log.`, tone: "red" });
        router.refresh();
      })
      .catch(() => {
        reinsert(row);
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      });
  }

  if (tasks.length === 0) {
    return <EmptyState eyebrow={emptyCopy.eyebrow} title={emptyCopy.title} body={emptyCopy.body} />;
  }

  return (
    <>
      <div className="border border-border bg-surface">
        {tasks.map((row) => (
          <TaskRow
            key={row.id}
            row={row}
            onToggle={() => handleToggle(row)}
            onDelete={() => setPendingDelete(row)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="red"
        eyebrow="PURGE RECORD"
        refLabel={pendingDelete?.ref}
        title="Purge this task?"
        body={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed permanently. Tasks are not recoverable — projects get decommissioned instead.`
            : ""
        }
        confirmLabel="PURGE"
        cancelLabel="KEEP"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
