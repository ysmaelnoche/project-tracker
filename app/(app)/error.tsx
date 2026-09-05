"use client";

import { useEffect } from "react";

// App-section error boundary — catches unexpected render/data errors inside
// any (app) page and shows a calm, on-brand message instead of Next's
// default overlay (PLAN.md "Error States": never expose raw technical
// errors). The underlying error is still logged for debugging.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="relative w-full max-w-[440px] border border-border-strong bg-surface-raised p-8 text-center">
        <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-red" />
        <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-red" />

        <div className="font-mono text-[9px] tracking-[0.2em] text-red">{"// SYSTEM ERROR"}</div>
        <h1 className="mt-4 font-mono text-[26px] font-light leading-tight tracking-[0.01em] text-ink">
          Something went wrong.
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
          That screen couldn&apos;t load. Your project and task data are unaffected.
        </p>

        <button
          onClick={reset}
          className="mt-7 cursor-pointer border border-border-strong bg-transparent px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-ink-2 transition-colors hover:border-amber hover:text-amber"
        >
          ▸ TRY AGAIN
        </button>
      </div>
    </div>
  );
}
