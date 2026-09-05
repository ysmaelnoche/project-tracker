"use client";

import { useState } from "react";
import { ConnectRepoForm } from "@/components/github/ConnectRepoForm";

/** One row in the Source screen's "projects without a repository" list. */
export function UnlinkedProjectRow({
  id,
  projectRef,
  name,
}: {
  id: string;
  projectRef: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-divider px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{projectRef}</span>
        <span className="font-mono text-[11px] tracking-[0.06em] text-ink-2">{name.toUpperCase()}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto cursor-pointer border border-border-strong bg-transparent px-2.5 py-1.5 font-mono text-[9px] tracking-[0.11em] text-ink-3 transition-colors hover:border-accent hover:text-accent"
        >
          {open ? "CANCEL" : "+ CONNECT"}
        </button>
      </div>
      {open ? (
        <div className="mt-3">
          <ConnectRepoForm projectId={id} onDone={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
