"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/projects/actions";
import { buildKeelSteps } from "@/lib/projects/create-sequence";
import { buildSequenceLines, computeSequencePercent, type SequenceStep } from "@/lib/ui/sequence";
import { BufferPanel } from "@/components/ui/BufferPanel";

const STEP_INTERVAL_MS = 300;

/**
 * New project form (PLAN.md "Creating a Project"). Client-driven so a
 * submission plays the shared "COMMITTING" buffering sequence
 * (lib/projects/create-sequence.ts) instead of leaving the operator staring
 * at an unchanged screen while `createProject` runs — see AccessForm for the
 * stage/ticking pattern this mirrors.
 */
export function NewProjectForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "committing">("form");
  const [steps, setSteps] = useState<SequenceStep[]>(() => buildKeelSteps(false));
  const [revealed, setRevealed] = useState(0);
  const [outcome, setOutcome] = useState<"pending" | "ok" | "fail">("pending");
  const [errorMessage, setErrorMessage] = useState("");
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const repoSlug = String(formData.get("repoSlug") ?? "").trim();
    const keelSteps = buildKeelSteps(!!repoSlug);
    const autoRevealCap = keelSteps.length - 1;

    setSteps(keelSteps);
    setOutcome("pending");
    setErrorMessage("");
    setRevealed(0);
    setStage("committing");

    intervalRef.current = setInterval(() => {
      setRevealed((n) => (n < autoRevealCap ? n + 1 : n));
    }, STEP_INTERVAL_MS);

    createProject(formData).then((result) => {
      if (result.ok) {
        stopTicking();
        setOutcome("ok");
        setRevealed(keelSteps.length);
        setTimeout(() => {
          if (result.repoWarning) {
            router.push(`/projects/${result.id}?repoError=${encodeURIComponent(result.repoWarning)}`);
          } else {
            router.push(`/projects/${result.id}`);
          }
          router.refresh();
        }, 600);
      } else {
        stopTicking();
        setOutcome("fail");
        setErrorMessage(result.error);
      }
    });
  }

  function retry() {
    setStage("form");
    setOutcome("pending");
    setRevealed(0);
    setErrorMessage("");
  }

  if (stage === "form") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            NAME
          </label>
          <input
            id="name"
            name="name"
            required
            autoFocus
            placeholder="e.g. Orbit"
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            DESCRIPTION
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What is this project, in one or two sentences?"
            className="mt-2.5 w-full resize-y border border-border-strong bg-track px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-accent"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            PROJECT TYPE
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-ink-2">
              <input type="radio" name="type" value="personal" defaultChecked required />
              PERSONAL
            </label>
            <label className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-ink-2">
              <input type="radio" name="type" value="work" required />
              WORK
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <label
              htmlFor="priority"
              className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
            >
              PRIORITY
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm uppercase tracking-[0.08em] outline-none transition-colors focus:border-accent"
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
            </select>
          </div>
          <div className="flex-1">
            <label
              htmlFor="targetDate"
              className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
            >
              TARGET DATE (OPTIONAL)
            </label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        <div className="border-t border-divider pt-5">
          <label htmlFor="repoSlug" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            REPOSITORY (OPTIONAL)
          </label>
          <input
            id="repoSlug"
            name="repoSlug"
            autoComplete="off"
            spellCheck={false}
            placeholder="owner/repo, or paste its GitHub URL"
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-xs tracking-[0.02em] text-ink outline-none transition-colors focus:border-accent"
          />
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            Link a GitHub repo now, or skip it and connect one later from the project&apos;s Source
            panel. Requires GitHub to be configured (Config → GitHub Connection).
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 w-full cursor-pointer bg-accent px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-accent-hover sm:w-auto sm:self-start"
        >
          + LAY KEEL
        </button>
      </form>
    );
  }

  const failed = outcome === "fail";
  const succeeded = outcome === "ok" && revealed >= steps.length;
  const lines = buildSequenceLines(steps, revealed, failed, {
    label: "COMMIT REJECTED",
    detail: errorMessage,
  });
  const percent = computeSequencePercent(steps, revealed, failed);
  const tone = failed ? "red" : succeeded ? "teal" : "accent";
  const eyebrow = failed ? "COMMIT REJECTED" : succeeded ? "KEEL LAID" : "COMMITTING";
  const subline = failed
    ? "The record was not written. Nothing was saved."
    : succeeded
      ? "Committed. Opening the project record…"
      : "Writing to the fleet ledger — do not close this panel.";

  return (
    <div>
      <BufferPanel tone={tone} eyebrow={eyebrow} subline={subline} percent={percent} lines={lines} />

      {failed ? (
        <button
          onClick={retry}
          className="mt-5 w-full cursor-pointer bg-accent px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-accent-hover"
        >
          ◂ RETRY
        </button>
      ) : null}
    </div>
  );
}
