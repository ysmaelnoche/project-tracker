"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { disconnectRepository } from "@/lib/github/actions";

/** Disconnects a repository (behind a confirm — this cascades away every cached branch/PR/commit). */
export function DisconnectRepoButton({
  repositoryId,
  projectId,
  repoSlug,
}: {
  repositoryId: string;
  projectId: string;
  repoSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function handleConfirm() {
    startTransition(async () => {
      const result = await disconnectRepository(repositoryId, projectId);
      setOpen(false);
      if (!result.ok) {
        toast.show({ label: "DISCONNECT FAILED", tone: "red", message: result.error });
        return;
      }
      toast.show({ label: "REPOSITORY UNLINKED", tone: "quiet", message: `${repoSlug} disconnected.` });
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em] text-ink-faint transition-colors hover:text-red"
      >
        DISCONNECT
      </button>
      <ConfirmDialog
        open={open}
        tone="red"
        eyebrow="DISCONNECT REPOSITORY"
        title={`Disconnect ${repoSlug}?`}
        body="Cached commits, branches, and pull requests for this repository are removed from the tracker. Nothing changes on GitHub itself, and you can reconnect it any time."
        confirmLabel="DISCONNECT"
        cancelLabel="CANCEL"
        onConfirm={handleConfirm}
        onClose={() => !isPending && setOpen(false)}
      />
    </>
  );
}
