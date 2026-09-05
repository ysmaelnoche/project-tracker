"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/projects/actions";
import { buildKeelSteps, KEEL_PAYOFF } from "@/lib/projects/create-sequence";
import type { EntryStage } from "@/lib/projects/entry-stage";
import { buildSequenceLines, computeSequencePercent, type SequenceStep } from "@/lib/ui/sequence";
import { BufferPanel } from "@/components/ui/BufferPanel";

const STEP_INTERVAL_MS = 300;

interface EntryStageOption {
  value: EntryStage;
  mark: string;
  markClass: string;
  label: string;
  note: string;
}

// Reuses StageBadge's own marks/colors (○ ink-faint, ● accent, ◈ teal) so a
// project registered straight into BUILD or DEPLOYED looks, from the first
// second, like the same badge it'll wear everywhere else in the console.
const ENTRY_STAGE_OPTIONS: EntryStageOption[] = [
  {
    value: "pending",
    mark: "○",
    markClass: "text-ink-faint",
    label: "STANDBY",
    note: "Nothing built yet. Tasks stay locked until you initiate the build yourself.",
  },
  {
    value: "in_development",
    mark: "●",
    markClass: "text-accent",
    label: "BUILD",
    note: "Already under construction. Today is recorded as the build start — tasks unlock immediately.",
  },
  {
    value: "production",
    mark: "◈",
    markClass: "text-teal",
    label: "DEPLOYED",
    note: "Already shipped. Set when it actually deployed below, or leave it blank to use today.",
  },
];

interface DateFieldCopy {
  label: string;
  helper: string;
  accentClass: string;
}

// The same input is relabeled per stage rather than hidden for DEPLOYED —
// it's still collecting one date, just a different one depending on what's
// true about the project already.
const DATE_FIELD_COPY: Record<EntryStage, DateFieldCopy> = {
  pending: {
    label: "TARGET DATE (OPTIONAL)",
    helper: "When you're aiming to ship — you can always change this later.",
    accentClass: "text-ink-faint",
  },
  in_development: {
    label: "TARGET DATE (OPTIONAL)",
    helper: "When you're aiming to ship — you can always change this later.",
    accentClass: "text-ink-faint",
  },
  production: {
    label: "DEPLOY DATE (OPTIONAL)",
    helper: "When it actually went live. Leave blank to record it as today.",
    accentClass: "text-teal",
  },
};

const SUCCESS_SUBLINE: Record<EntryStage, string> = {
  pending: "Committed. Opening the project record…",
  in_development: "Committed. This one's already moving — opening its record…",
  production: "Committed. This one's already live — opening its record…",
};

/**
 * New project form (PLAN.md "Creating a Project"). Client-driven so a
 * submission plays the shared "COMMITTING" buffering sequence
 * (lib/projects/create-sequence.ts) instead of leaving the operator staring
 * at an unchanged screen while `createProject` runs — see AccessForm for the
 * stage/ticking pattern this mirrors.
 *
 * "Lay a keel" doesn't have to mean starting from zero — the ENTRY STAGE
 * picker (lib/projects/entry-stage.ts) lets the operator register a project
 * that's already mid-build or already shipped, each with its own animated
 * sequence and payoff term (KEEL_PAYOFF) rather than pretending every
 * project starts fresh.
 */
export function NewProjectForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "committing">("form");
  const [entryStage, setEntryStage] = useState<EntryStage>("pending");
  const [steps, setSteps] = useState<SequenceStep[]>(() => buildKeelSteps("pending", false));
  const [revealed, setRevealed] = useState(0);
  const [outcome, setOutcome] = useState<"pending" | "ok" | "fail">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [payoff, setPayoff] = useState<string>(KEEL_PAYOFF.pending);
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
    const keelSteps = buildKeelSteps(entryStage, !!repoSlug);
    const autoRevealCap = keelSteps.length - 1;

    setSteps(keelSteps);
    setPayoff(KEEL_PAYOFF[entryStage]);
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
    const dateCopy = DATE_FIELD_COPY[entryStage];
    const activeNote = ENTRY_STAGE_OPTIONS.find((o) => o.value === entryStage)?.note;

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

        <fieldset className="flex flex-col gap-2 border-t border-divider pt-5">
          <legend className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            ENTRY STAGE
          </legend>
          <div className="flex flex-wrap gap-4">
            {ENTRY_STAGE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-ink-2"
              >
                <input
                  type="radio"
                  name="entryStage"
                  value={opt.value}
                  checked={entryStage === opt.value}
                  onChange={() => setEntryStage(opt.value)}
                />
                <span className={opt.markClass}>{opt.mark}</span> {opt.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">{activeNote}</p>
        </fieldset>

        <div className="flex flex-col gap-4">
          <div>
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

          <div>
            <label
              htmlFor="targetDate"
              className={`block font-mono text-[9px] tracking-[0.16em] transition-colors duration-300 ${dateCopy.accentClass}`}
            >
              <span key={entryStage} className="inline-block [animation:inject_0.25s_ease]">
                {dateCopy.label}
              </span>
            </label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              className={`mt-2.5 w-full border bg-track px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent ${
                entryStage === "production" ? "border-teal/50" : "border-border-strong"
              }`}
            />
            <p
              key={`helper-${entryStage}`}
              className="mt-2 font-mono text-[10px] leading-relaxed text-ink-3 [animation:inject_0.25s_ease]"
            >
              {dateCopy.helper}
            </p>
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
  const eyebrow = failed ? "COMMIT REJECTED" : succeeded ? payoff : "COMMITTING";
  const subline = failed
    ? "The record was not written. Nothing was saved."
    : succeeded
      ? SUCCESS_SUBLINE[entryStage]
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
