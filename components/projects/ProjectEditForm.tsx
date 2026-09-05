"use client";

import { useState } from "react";
import { updateProject } from "@/lib/projects/actions";
import type { Priority, Project } from "@/lib/types";

const PRIORITIES: Priority[] = ["low", "medium", "high"];

/**
 * Inline "edit project" disclosure (name/description/priority/target date —
 * PLAN.md "Pending Projects": editable at every stage). The parent page keys
 * this component by `project.updatedAt` so a successful save remounts it back
 * into its closed, read state automatically.
 */
export function ProjectEditForm({
  project,
  error,
}: {
  project: Pick<Project, "id" | "name" | "description" | "priority" | "targetDate">;
  error?: string;
}) {
  const [editing, setEditing] = useState(!!error);
  const action = updateProject.bind(null, project.id);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.14em] text-ink-faint hover:text-accent"
      >
        EDIT DETAILS
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 flex w-full flex-col gap-3 border border-border bg-surface p-4">
      {error ? (
        <p className="font-mono text-[10px] tracking-[0.04em] text-red">
          {error === "name_required" ? "Name is required." : "Could not save those changes."}
        </p>
      ) : null}

      <div>
        <label htmlFor="edit-name" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
          NAME
        </label>
        <input
          id="edit-name"
          name="name"
          required
          defaultValue={project.name}
          className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="edit-description"
          className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
        >
          DESCRIPTION
        </label>
        <textarea
          id="edit-description"
          name="description"
          rows={3}
          defaultValue={project.description}
          className="mt-2 w-full resize-y border border-border-strong bg-track px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <label
            htmlFor="edit-priority"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            PRIORITY
          </label>
          <select
            id="edit-priority"
            name="priority"
            defaultValue={project.priority}
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] outline-none focus:border-accent"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="edit-target"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            TARGET DATE
          </label>
          <input
            id="edit-target"
            name="targetDate"
            type="date"
            defaultValue={project.targetDate ?? ""}
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-xs outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="cursor-pointer bg-accent px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg hover:bg-accent-hover"
        >
          SAVE
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="cursor-pointer border border-border-strong bg-transparent px-4 py-2.5 font-mono text-[10px] tracking-[0.13em] text-ink-2 hover:border-ink hover:text-ink"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
