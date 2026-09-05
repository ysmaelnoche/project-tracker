"use client";

import { useState, useTransition } from "react";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/Toast";
import { addProjectLink, removeProjectLink } from "@/lib/projects/actions";
import type { ProjectLink } from "@/lib/types";

/** Arbitrary reference links (repo, staging, docs…) — PLAN.md "Project Information". */
export function LinksPanel({ projectId, links }: { projectId: string; links: ProjectLink[] }) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      try {
        await addProjectLink(projectId, formData);
        setAdding(false);
      } catch {
        toast.show({
          label: "LINK NOT SAVED",
          tone: "red",
          message: "Could not save that link. Check the label and URL and try again.",
        });
      }
    });
  }

  function handleRemove(linkId: string) {
    startTransition(async () => {
      try {
        await removeProjectLink(projectId, linkId);
      } catch {
        toast.show({ label: "REMOVE FAILED", tone: "red", message: "Could not remove that link." });
      }
    });
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>UPLINKS</PanelTitle>
        <button
          onClick={() => setAdding((v) => !v)}
          className="ml-auto cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.14em] text-amber hover:text-amber-hover"
        >
          {adding ? "CANCEL" : "+ ADD LINK"}
        </button>
      </PanelHeader>

      {adding ? (
        <form action={handleAdd} className="flex flex-col gap-2 border-b border-divider p-4">
          <input
            name="label"
            required
            placeholder="LABEL — e.g. REPOSITORY"
            className="border border-border-strong bg-track px-3 py-2 font-mono text-xs tracking-[0.08em] outline-none focus:border-amber"
          />
          <input
            name="url"
            type="url"
            required
            placeholder="https://…"
            className="border border-border-strong bg-track px-3 py-2 font-mono text-xs tracking-[0.02em] outline-none focus:border-amber"
          />
          <button
            type="submit"
            disabled={isPending}
            className="self-start cursor-pointer bg-amber px-3 py-2 font-mono text-[9px] font-medium tracking-[0.13em] text-bg hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            SAVE LINK
          </button>
        </form>
      ) : null}

      {links.length === 0 ? (
        <div className="px-4 py-6 text-sm text-ink-3">No uplinks attached.</div>
      ) : (
        <div>
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-start gap-3 border-b border-divider px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
                  {link.label}
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate font-mono text-xs tracking-[0.02em] text-amber hover:text-amber-hover"
                >
                  {link.url}
                </a>
              </div>
              <button
                onClick={() => handleRemove(link.id)}
                disabled={isPending}
                aria-label={`Remove ${link.label}`}
                className="flex-none cursor-pointer border-0 bg-transparent px-0.5 font-mono text-[11px] text-ink-disabled hover:text-red"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
