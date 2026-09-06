"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { deleteTask, toggleTaskStatus, updateTask } from "@/lib/tasks/actions";
import type { TaskRowView } from "@/lib/tasks/present";
import { EditTaskDialog, type EditTaskFields } from "./EditTaskDialog";
import { TaskRow } from "./TaskRow";

interface EmptyCopy {
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * Owns the Queue list's interaction state: a confirm-then-complete flow
 * (the checkbox is a small target — a stray click shouldn't silently close
 * a task), optimistic complete with an UNDO toast once confirmed, an
 * un-gated single-click reopen, an edit flow (dialog prefilled with the
 * task's current fields, Save doubling as the confirmation step), and a
 * confirm-then-purge delete flow — matching the reference's
 * `toggleTask`/`confirmDelete`. `router.refresh()` after each mutation
 * resyncs the view/context tab counts, which are computed server-side by
 * the parent page.
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
  const [pendingComplete, setPendingComplete] = useState<TaskRowView | null>(null);
  const [pendingEdit, setPendingEdit] = useState<TaskRowView | null>(null);
  const [committing, setCommitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function reinsert(row: TaskRowView) {
    setTasks((current) => (current.some((t) => t.id === row.id) ? current : [row, ...current]));
  }

  function remove(id: string) {
    setTasks((current) => current.filter((t) => t.id !== id));
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
            tone: "accent",
          });
        }
        router.refresh();
      })
      .catch(() => {
        onSettled?.();
        reinsert(row);
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      });
  }

  // Completing goes through a confirmation first; reopening (undoing a
  // mistaken close) stays a single click.
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

  function confirmEdit(fields: EditTaskFields) {
    if (!pendingEdit || savingEdit) return;
    const row = pendingEdit;
    setSavingEdit(true);

    updateTask({ id: row.id, ...fields })
      .then((result) => {
        setSavingEdit(false);
        if (!result.ok) {
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }
        setPendingEdit(null);
        toast.show({
          label: "TASK UPDATED",
          message: `"${fields.title}" was saved.`,
          tone: "accent",
        });
        router.refresh();
      })
      .catch(() => {
        setSavingEdit(false);
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
            onToggle={() => requestToggle(row)}
            onEdit={() => setPendingEdit(row)}
            onDelete={() => setPendingDelete(row)}
          />
        ))}
      </div>

      <EditTaskDialog
        key={pendingEdit?.id ?? "edit-none"}
        open={pendingEdit !== null}
        refLabel={pendingEdit?.ref}
        initial={
          pendingEdit
            ? { title: pendingEdit.title, priority: pendingEdit.priority, dueDate: pendingEdit.dueDate }
            : { title: "", priority: "medium", dueDate: null }
        }
        pending={savingEdit}
        onSave={confirmEdit}
        onClose={() => {
          if (!savingEdit) setPendingEdit(null);
        }}
      />

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
