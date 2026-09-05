"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/Toast";
import { createTask } from "@/lib/tasks/actions";
import type { ProjectOptionView } from "@/lib/tasks/present";
import type { Priority } from "@/lib/types";

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: "low", label: "LOW" },
  { key: "medium", label: "MED" },
  { key: "high", label: "HIGH" },
];

const STANDALONE_OPTION = {
  id: null as string | null,
  label: "No project — standalone task",
  meta: "STANDALONE",
  disabled: false,
};

/**
 * New task form: title, optional project, priority, due date. A pending
 * project stays visible in the picker but disabled ("LOCKED") — the
 * proactive UI half of PLAN.md's "Project Task Business Rule"; the database
 * trigger (`tasks_enforce_project_started`) is the real guard, and a clean
 * message surfaces via toast if that trigger ever fires anyway.
 */
export function NewTaskForm({
  options,
  defaultProjectId,
  hideStandaloneOption,
}: {
  options: ProjectOptionView[];
  defaultProjectId: string | null;
  hideStandaloneOption: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const pickerOptions = hideStandaloneOption ? options : [STANDALONE_OPTION, ...options];

  const initialProjectId = (() => {
    if (!defaultProjectId) return null;
    const match = options.find((o) => o.id === defaultProjectId);
    return match && !match.disabled ? match.id : null;
  })();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = pickerOptions.find((o) => o.id === projectId) ?? null;
  const isLockedSelection = !!selected?.disabled;
  const hasLockedProjects = options.some((o) => o.disabled);
  const canSubmit = title.trim().length > 0 && !isLockedSelection && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const result = await createTask({
      title,
      projectId,
      priority,
      dueDate: dueDate || null,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
      return;
    }

    toast.show({
      label: "TASK CREATED",
      message: projectId ? "Queued under the selected project." : "Queued as a standalone task.",
      tone: "amber",
    });
    router.push("/tasks");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[520px] border border-border bg-surface">
      <div className="flex flex-wrap items-baseline gap-3 border-b border-border px-5 py-3.5">
        <span className="font-mono text-[9px] tracking-[0.18em] text-amber">{"// QUEUE TASK"}</span>
        <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint">
          NEW QUEUE ENTRY
        </span>
      </div>

      <div className="px-5 py-6">
        <label htmlFor="task-title" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
          TASK
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Send follow-up email"
          autoFocus
          className="mt-2.5 mb-6 w-full border border-border-strong bg-track px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-amber"
        />

        <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">ASSIGN TO</div>
        <div className="mt-2.5 mb-2 max-h-[186px] overflow-auto border border-border bg-track">
          {pickerOptions.map((o) => {
            const isSelected = projectId === o.id;
            return (
              <button
                key={o.id ?? "standalone"}
                type="button"
                disabled={o.disabled}
                onClick={() => setProjectId(o.id)}
                className={`flex w-full items-center gap-3 border-b border-l-2 border-divider px-3.5 py-2.5 text-left last:border-b-0 ${
                  o.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                } ${isSelected ? "border-l-amber bg-surface-hover" : "border-l-transparent"}`}
              >
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{o.label}</span>
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.11em] ${
                    o.disabled ? "text-red" : "text-ink-faint"
                  }`}
                >
                  {o.meta}
                </span>
              </button>
            );
          })}
        </div>
        {hasLockedProjects ? (
          <p className="mb-6 text-xs leading-relaxed text-ink-3">
            Development hasn&apos;t started yet. Start development before creating tasks for
            this project.
          </p>
        ) : (
          <div className="mb-6" />
        )}

        <div className="flex flex-wrap gap-5">
          <div className="flex-1 basis-[150px]">
            <label htmlFor="task-due" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
              DEADLINE
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-[13px] outline-none transition-colors focus:border-amber"
            />
          </div>
          <div className="flex-1 basis-[150px]">
            <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">PRIORITY</div>
            <div className="mt-2.5 flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className={`cursor-pointer border px-3 py-2 font-mono text-[9px] tracking-[0.12em] ${
                    priority === p.key
                      ? "border-amber bg-amber text-bg"
                      : "border-border-strong bg-transparent text-ink-2"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="mt-5 font-mono text-xs tracking-[0.04em] text-red">{error}</p> : null}
      </div>

      <div className="flex justify-end gap-2 px-5 pb-5">
        <Link
          href="/tasks"
          className="cursor-pointer border border-border-strong bg-transparent px-4 py-2.5 font-mono text-[10px] tracking-[0.13em] text-ink-2 hover:border-ink hover:text-ink"
        >
          ABORT
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="cursor-pointer border-0 bg-amber px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "QUEUEING…" : "QUEUE TASK"}
        </button>
      </div>
    </form>
  );
}
