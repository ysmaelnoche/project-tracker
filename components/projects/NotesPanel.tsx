"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { updateNotes } from "@/lib/projects/actions";

/**
 * Free-form project notes. The parent page keys this component by
 * `project.updatedAt` so a successful save remounts it back into read mode
 * automatically — since `updateNotes` no longer redirects, this now drives
 * that refresh itself via `router.refresh()`, and surfaces failures as a
 * toast (matching `components/projects/LinksPanel.tsx`).
 */
export function NotesPanel({ projectId, notes }: { projectId: string; notes: string }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateNotes(projectId, formData);
      if (result.ok) {
        router.refresh();
      } else {
        toast.show({ label: "NOTES NOT SAVED", tone: "red", message: result.error });
      }
    });
  }

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
        <form action={handleSubmit} className="flex flex-col gap-2 p-4">
          <textarea
            name="notes"
            defaultValue={notes}
            rows={5}
            placeholder="Anything worth remembering about this project…"
            className="resize-y border border-border-strong bg-track px-3 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={pending}
            className="self-start cursor-pointer bg-accent px-3 py-2 font-mono text-[9px] font-medium tracking-[0.13em] text-bg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> SAVING…
              </span>
            ) : (
              "SAVE NOTES"
            )}
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
