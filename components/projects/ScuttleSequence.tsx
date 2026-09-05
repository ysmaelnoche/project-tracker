"use client";

import { useEffect, useRef, useState } from "react";
import { BufferPanel } from "@/components/ui/BufferPanel";
import { buildSequenceLines, computeSequencePercent } from "@/lib/ui/sequence";
import { SCUTTLE_FAILED_STEP, SCUTTLE_STEPS } from "@/lib/projects/scuttle-sequence";

const COUNTDOWN_SECONDS = 5;
const STEP_INTERVAL_MS = 300;
const AUTO_REVEAL_CAP = SCUTTLE_STEPS.length - 1;

type Phase = "countdown" | "scuttling" | "failed";

export interface ScuttleResult {
  ok: boolean;
  error?: string;
}

/**
 * The countdown-and-execute half of SCUTTLE — permanently deleting a
 * project (never anything on GitHub; `onScuttle` must never call the
 * GitHub API, see lib/projects/actions.ts's `scuttleProject`). By the time
 * this opens, the operator has already confirmed once in a plain
 * ConfirmDialog upstream (see ProjectActions.tsx's "SCUTTLE THE SHIP?"
 * dialog) — this is the second, harder-to-stop layer: a large visible
 * countdown that auto-proceeds unless canceled, then the same staged
 * BufferPanel mechanism every other CRUD write uses.
 */
export function ScuttleSequence({
  open,
  projectRef,
  projectName,
  onScuttle,
  onScuttled,
  onClose,
}: {
  open: boolean;
  projectRef: string;
  projectName: string;
  /** Perform the real deletion. Must never touch the GitHub API. */
  onScuttle: () => Promise<ScuttleResult>;
  /** Called once the buffer's payoff line has been shown — navigate/toast here. */
  onScuttled: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(COUNTDOWN_SECONDS);

  // "Reset all state when open flips true" — done during render (React's
  // documented pattern for this) rather than in an effect, so each fresh
  // open starts a clean countdown without a cascading-render lint issue.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setPhase("countdown");
    setSecondsLeft(COUNTDOWN_SECONDS);
    setRevealed(0);
    setError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }
  function stopTicker() {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }

  function runScuttle() {
    setPhase("scuttling");
    setRevealed(0);
    setError(null);

    tickerRef.current = setInterval(() => {
      setRevealed((n) => (n < AUTO_REVEAL_CAP ? n + 1 : n));
    }, STEP_INTERVAL_MS);

    onScuttle().then((result) => {
      stopTicker();
      if (result.ok) {
        setRevealed(SCUTTLE_STEPS.length);
        setTimeout(onScuttled, 600);
      } else {
        setPhase("failed");
        setError(result.error ?? "Something went wrong. The project was not deleted.");
      }
    });
  }

  function handleCancel() {
    if (phase !== "countdown") return; // no canceling mid-delete
    stopCountdown();
    onClose();
  }

  // Clear any running timers on unmount.
  useEffect(() => {
    return () => {
      stopCountdown();
      stopTicker();
    };
  }, []);

  // The countdown itself — ticks once a second while phase is "countdown",
  // handing off to the scuttle buffer when it reaches zero. The zero-check
  // lives in the timer's own callback (an external system reacting to its
  // own tick), not in the effect body itself, matching AccessForm's ticker.
  useEffect(() => {
    if (!open || phase !== "countdown") return;
    remainingRef.current = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
      remainingRef.current = Math.max(remainingRef.current - 1, 0);
      setSecondsLeft(remainingRef.current);
      if (remainingRef.current === 0) {
        stopCountdown();
        runScuttle();
      }
    }, 1000);
    return () => stopCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runScuttle closes over onScuttle/onScuttled, which the caller passes fresh each render; re-running this effect on every render would restart the countdown, so it intentionally only re-runs when the countdown itself should (re)start
  }, [open, phase]);

  if (!open) return null;

  const failed = phase === "failed";
  const lines = buildSequenceLines(SCUTTLE_STEPS, revealed, failed, {
    ...SCUTTLE_FAILED_STEP,
    detail: error ?? SCUTTLE_FAILED_STEP.detail,
  });
  const percent = computeSequencePercent(SCUTTLE_STEPS, revealed, failed);

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center overflow-auto bg-black/80 p-5"
      onClick={phase === "countdown" ? handleCancel : undefined}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-[480px] animate-[lift_0.18s_ease] border border-red bg-surface-raised shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-red" />
        <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-red" />

        <div className="flex flex-wrap items-baseline gap-3 border-b border-border px-5 py-3.5">
          <span className="font-mono text-[9px] tracking-[0.2em] text-red">{"// SCUTTLE SEQUENCE"}</span>
          <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint">{projectRef}</span>
        </div>

        {phase === "countdown" ? (
          <div className="px-6 py-8 text-center">
            <div className="font-mono text-[76px] font-light leading-none tabular-nums text-red [animation:sweep_1s_ease-in-out_infinite]">
              {secondsLeft}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">
              Scuttling <span className="text-ink">{projectName}</span> — tasks, notes, links,
              and GitHub sync history go down with it. The GitHub repository itself is never
              touched.
            </p>
            <button
              onClick={handleCancel}
              className="mt-6 w-full cursor-pointer border border-border-strong bg-transparent px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-ink transition-colors hover:border-ink"
            >
              ✕ ABORT
            </button>
          </div>
        ) : (
          <div className="px-6 py-6">
            <BufferPanel
              tone="red"
              eyebrow={failed ? "SCUTTLE FAILED" : percent === 100 ? "SCUTTLED" : "SCUTTLING"}
              subline={
                failed
                  ? (error ?? "Something went wrong. The project was not deleted.")
                  : percent === 100
                    ? `${projectName} is gone. Nothing on GitHub was touched.`
                    : "Deleting the record — do not close this panel."
              }
              percent={percent}
              lines={lines}
            />
            {failed ? (
              <button
                onClick={onClose}
                className="mt-5 w-full cursor-pointer border border-border-strong bg-transparent px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-ink transition-colors hover:border-ink"
              >
                CLOSE
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
