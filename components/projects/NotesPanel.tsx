"use client";

import { useState } from "react";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { updateNotes } from "@/lib/projects/actions";

/**
 * Free-form project notes. A plain progressively-enhanced form action — the
 * parent page keys this component by `project.updatedAt` so a successful save
 * remounts it back into read mode automatically.
 */
export function NotesPanel({ projectId, notes }: { projectId: string; notes: string }) {
  const [editing, setEditing] = useState(false);
  const action = updateNotes.bind(null, projectId);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>NOTES</PanelTitle>
        <button
          onClick={() => setEditing((v) => !v)}
          className="ml-auto cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.14em] text-accent hover:text-accent-hover"
        >
          {editing ? "CANCEL" : notes ? "EDIT" : "+ ADD NOTES"}
        </button>
      </PanelHeader>

      {editing ? (
        <form action={action} className="flex flex-col gap-2 p-4">
          <textarea
            name="notes"
            defaultValue={notes}
            rows={5}
            placeholder="Anything worth remembering about this project…"
            className="resize-y border border-border-strong bg-track px-3 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="self-start cursor-pointer bg-accent px-3 py-2 font-mono text-[9px] font-medium tracking-[0.13em] text-bg hover:bg-accent-hover"
          >
            SAVE NOTES
          </button>
        </form>
      ) : notes ? (
        <p className="m-0 whitespace-pre-wrap p-4 text-sm leading-relaxed text-ink-2">{notes}</p>
      ) : (
        <div className="px-4 py-6 text-sm text-ink-3">Nothing written down yet.</div>
      )}
    </Panel>
  );
}
