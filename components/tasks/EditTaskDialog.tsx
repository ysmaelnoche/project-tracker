"use client";

import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { priorityLabel } from "@/lib/priority";
import type { Priority } from "@/lib/types";

const PRIORITIES: Priority[] = ["low", "medium", "high"];

export interface EditTaskFields {
  title: string;
  priority: Priority;
  dueDate: string | null;
}

interface EditTaskDialogProps {
  open: boolean;
  refLabel?: string;
  initial: EditTaskFields;
  /** While true, both actions disable and Save shows a spinner — same
   * lifecycle-transition buffering convention as ConfirmDialog's `pending`. */
  pending?: boolean;
  onSave: (fields: EditTaskFields) => void;
  onClose: () => void;
}

/**
 * Edit-in-place dialog for a task's title, priority, and due date. Visually
 * matches ConfirmDialog's modal chrome (same corner brackets, eyebrow/ref
 * header, footer button treatment) so it reads as the same confirm-before-
 * commit family — Save is the confirmation step, Cancel discards the edits.
 * Field inputs mirror NewTaskForm's. Uncontrolled internally: the caller
 * remounts with a fresh `key` per task (see TaskQueueList) so `initial`
 * only needs to seed state once per open task.
 */
export function EditTaskDialog({
  open,
  refLabel,
  initial,
  pending = false,
  onSave,
  onClose,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(initial.title);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [dueDate, setDueDate] = useState(initial.dueDate ?? "");

  if (!open) return null;

  const canSave = title.trim().length > 0;

  function handleSave() {
    if (!canSave || pending) return;
    onSave({ title: title.trim(), priority, dueDate: dueDate || null });
  }

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center overflow-auto bg-black/76 p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-[472px] animate-[lift_0.18s_ease] border border-border-strong bg-surface-raised shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-accent" />
        <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-accent" />

        <div className="flex flex-wrap items-baseline gap-3 border-b border-border px-5 py-3.5">
          <span className="font-mono text-[9px] tracking-[0.18em] text-accent">{"// EDIT TASK"}</span>
          {refLabel ? (
            <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint">
              {refLabel}
            </span>
          ) : null}
        </div>

        <div className="px-5 pb-6 pt-6">
          <label
            htmlFor="edit-task-title"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            TASK
          </label>
          <input
            id="edit-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            disabled={pending}
            className="mt-2.5 mb-6 w-full border border-border-strong bg-track px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-accent disabled:opacity-60"
          />

          <div className="flex flex-wrap gap-5">
            <div className="flex-1 basis-[150px]">
              <label
                htmlFor="edit-task-due"
                className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
              >
                DEADLINE
              </label>
              <input
                id="edit-task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={pending}
                className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-[13px] outline-none transition-colors focus:border-accent disabled:opacity-60"
              />
            </div>
            <div className="flex-1 basis-[220px]">
              <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">PRIORITY</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={pending}
                    onClick={() => setPriority(p)}
                    className={`cursor-pointer whitespace-nowrap border px-3 py-2 font-mono text-[9px] tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${
                      priority === p
                        ? "border-accent bg-accent text-bg"
                        : "border-border-strong bg-transparent text-ink-2"
                    }`}
                  >
                    {priorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer border border-border-strong bg-transparent px-4 py-2.5 font-mono text-[10px] tracking-[0.13em] text-ink-2 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !canSave}
              className="cursor-pointer border-0 bg-accent px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> SAVING…
                </span>
              ) : (
                "SAVE"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
