"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { connectRepository } from "@/lib/github/actions";

/**
 * Small "owner/repo" connect form — used both from `RepoPanel`'s empty state
 * and from the Source screen's per-project "unlinked" row. Validates + does
 * the initial backfill server-side (`connectRepository`); this just owns the
 * pending/error UI.
 */
export function ConnectRepoForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await connectRepository(projectId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.show({
        label: "REPOSITORY LINKED",
        tone: "accent",
        message: "Backfilling branches, commits, and pull requests…",
      });
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2">
      <input
        name="slug"
        required
        placeholder="owner/repo — e.g. me/my-project"
        className="border border-border-strong bg-track px-3 py-2 font-mono text-xs tracking-[0.04em] text-ink outline-none focus:border-accent"
      />
      {error ? <p className="text-xs leading-relaxed text-red">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="self-start cursor-pointer bg-accent px-3.5 py-2 font-mono text-[9px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> LINKING…
          </span>
        ) : (
          "+ LINK REPO"
        )}
      </button>
    </form>
  );
}
