"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BufferPanel } from "@/components/ui/BufferPanel";
import { useToast } from "@/components/ui/Toast";
import { connectRepository } from "@/lib/github/actions";
import { LINK_STEPS } from "@/lib/github/link-sequence";
import { buildSequenceLines, computeSequencePercent, type SequenceStep } from "@/lib/ui/sequence";

const STEP_INTERVAL_MS = 300;
// The timer only ever auto-reveals up to the second-to-last step — the final
// "BACKFILLING ACTIVITY" line is held back until connectRepository() actually
// confirms success, mirroring AccessForm's AUTHENTICATING sequence.
const AUTO_REVEAL_CAP = LINK_STEPS.length - 1;

/**
 * Small "owner/repo" connect form — used both from `RepoPanel`'s empty state
 * and from the Source screen's per-project "unlinked" row. Validates + does
 * the initial backfill server-side (`connectRepository`); this just owns the
 * pending/error UI, staged as the shared "LINKING" buffer sequence.
 */
export function ConnectRepoForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const router = useRouter();
  const toast = useToast();

  const [stage, setStage] = useState<"form" | "linking">("form");
  const [revealed, setRevealed] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failStep, setFailStep] = useState<SequenceStep | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function stopTicking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function handleSubmit(formData: FormData) {
    setFailed(false);
    setFailStep(null);
    setRevealed(0);
    setStage("linking");

    intervalRef.current = setInterval(() => {
      setRevealed((n) => (n < AUTO_REVEAL_CAP ? n + 1 : n));
    }, STEP_INTERVAL_MS);

    connectRepository(projectId, formData).then((result) => {
      if (!result.ok) {
        stopTicking();
        setFailed(true);
        setFailStep({ label: "UPLINK FAILED", detail: result.error });
        return;
      }

      stopTicking();
      setRevealed(LINK_STEPS.length);
      setTimeout(() => {
        toast.show({
          label: "REPOSITORY LINKED",
          tone: "accent",
          message: "Backfilling branches, commits, and pull requests…",
        });
        onDone?.();
        router.refresh();
      }, 500);
    });
  }

  function retry() {
    setStage("form");
    setFailed(false);
    setFailStep(null);
    setRevealed(0);
  }

  if (stage === "form") {
    return (
      <form action={handleSubmit} className="flex flex-col gap-2">
        <input
          name="slug"
          required
          placeholder="owner/repo, or paste its GitHub URL"
          className="border border-border-strong bg-track px-3 py-2 font-mono text-xs tracking-[0.04em] text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="self-start cursor-pointer bg-accent px-3.5 py-2 font-mono text-[9px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-accent-hover"
        >
          + LINK REPO
        </button>
      </form>
    );
  }

  const succeeded = !failed && revealed >= LINK_STEPS.length;
  const lines = buildSequenceLines(LINK_STEPS, revealed, failed, failStep ?? { label: "UPLINK FAILED", detail: "" });
  const percent = computeSequencePercent(LINK_STEPS, revealed, failed);
  const tone = failed ? "red" : succeeded ? "teal" : "accent";
  const eyebrow = failed ? "UPLINK FAILED" : succeeded ? "UPLINK ESTABLISHED" : "LINKING";
  const subline = failed
    ? "The repository could not be linked."
    : succeeded
      ? "Repository linked. Backfilling activity…"
      : "Contacting GitHub — do not close this panel.";

  return (
    <div>
      <BufferPanel tone={tone} eyebrow={eyebrow} subline={subline} percent={percent} lines={lines} minHeightPx={110} />
      {failed ? (
        <button
          onClick={retry}
          className="mt-4 cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-accent hover:text-accent"
        >
          ◂ RETRY
        </button>
      ) : null}
    </div>
  );
}
