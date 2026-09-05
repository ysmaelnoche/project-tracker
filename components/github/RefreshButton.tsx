"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { refreshRepository } from "@/lib/github/actions";

/**
 * The entire "sync strategy" for this integration: an on-demand refresh
 * button, no webhooks (see PLAN.md "GitHub Refresh Behavior" / the repo's
 * architecture decision).
 */
export function RefreshButton({ repositoryId, projectId }: { repositoryId: string; projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshRepository(repositoryId, projectId);
      if (!result.ok) {
        toast.show({
          label: "SYNC FAILED",
          tone: "red",
          message: `${result.error} Your project and task data are unaffected.`,
        });
      } else {
        toast.show({ label: "SYNCED", tone: "teal", message: "Repository activity refreshed." });
      }
      router.refresh();
    });
  }

  return (
    <Button variant="secondary" onClick={handleRefresh} disabled={isPending}>
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner /> REFRESHING…
        </span>
      ) : (
        "↻ REFRESH"
      )}
    </Button>
  );
}
