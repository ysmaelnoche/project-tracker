"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithUsername } from "@/lib/auth/actions";
import { AUTH_STEPS, buildAuthLines, computeAuthPercent } from "@/lib/auth/auth-sequence";

const STEP_INTERVAL_MS = 300;
// The timer only ever auto-reveals up to the second-to-last step — the final
// "ACCESS GRANTED" line is held back until signInWithUsername() actually
// confirms success, so the animation can never claim an outcome before it's
// real (see lib/auth/auth-sequence.ts).
const AUTO_REVEAL_CAP = AUTH_STEPS.length - 1;

type Outcome = "pending" | "ok" | "fail";

export function AccessForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "auth">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("pending");
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
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!username || !password) {
      setFormError("Enter both an operator ID and a passcode.");
      return;
    }

    setFormError(null);
    setOutcome("pending");
    setRevealed(0);
    setStage("auth");

    intervalRef.current = setInterval(() => {
      setRevealed((n) => (n < AUTO_REVEAL_CAP ? n + 1 : n));
    }, STEP_INTERVAL_MS);

    signInWithUsername(formData).then((result) => {
      if (result.ok) {
        stopTicking();
        setOutcome("ok");
        setRevealed(AUTH_STEPS.length);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 560);
      } else {
        stopTicking();
        setOutcome("fail");
      }
    });
  }

  function retry() {
    setStage("form");
    setOutcome("pending");
    setRevealed(0);
    setFormError(null);
  }

  if (stage === "form") {
    return (
      <div>
        <div className="font-mono text-[9px] tracking-[0.2em] text-amber">
          {"// IDENTITY VERIFICATION"}
        </div>
        <h1 className="mt-4 font-mono text-[clamp(23px,2.8vw,28px)] font-light leading-tight tracking-[0.01em] text-ink">
          Request access.
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
          Single operator, single log. Supabase verifies your passcode — this app never stores it.
        </p>

        <form action={handleSubmit} className="mt-7">
          <label
            htmlFor="username"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            OPERATOR ID
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="operator"
            onChange={() => setFormError(null)}
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
          />

          <div className="mt-4.5 flex items-baseline gap-3">
            <label
              htmlFor="password"
              className="font-mono text-[9px] tracking-[0.16em] text-ink-faint"
            >
              PASSCODE
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="ml-auto cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em] text-ink-3 transition-colors hover:text-amber"
            >
              {showPassword ? "HIDE" : "REVEAL"}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            onChange={() => setFormError(null)}
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
          />

          {formError ? (
            <p className="mt-2.5 font-mono text-xs tracking-[0.04em] text-red">{`⚠ ${formError}`}</p>
          ) : null}

          <button
            type="submit"
            className="mt-5 w-full cursor-pointer bg-amber px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-amber-hover"
          >
            ▸ AUTHENTICATE
          </button>
        </form>

        <div className="mt-6 font-mono text-[9px] leading-loose tracking-[0.12em] text-ink-disabled">
          ROW-LEVEL SECURITY ACTIVE
          <br />
          OWNERSHIP ENFORCED AT DATABASE LAYER
        </div>
      </div>
    );
  }

  const failed = outcome === "fail";
  const succeeded = outcome === "ok" && revealed >= AUTH_STEPS.length;
  const lines = buildAuthLines(revealed, failed);
  const percent = computeAuthPercent(revealed, failed);
  const tone = failed ? "red" : succeeded ? "teal" : "amber";
  const headline = failed ? "ACCESS DENIED" : succeeded ? "ACCESS GRANTED" : "AUTHENTICATING";
  const subline = failed
    ? "The passcode did not match the operator record."
    : succeeded
      ? "Session established. Loading console…"
      : "Verifying operator credentials — do not close this terminal.";

  const toneText = tone === "red" ? "text-red" : tone === "teal" ? "text-teal" : "text-amber";
  const toneBg = tone === "red" ? "bg-red" : tone === "teal" ? "bg-teal" : "bg-amber";

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={`font-mono text-[9px] tracking-[0.2em] ${toneText}`}>{`// ${headline}`}</span>
        <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint tabular-nums">
          {percent}%
        </span>
      </div>

      <div className="mt-3.5 h-[3px] border border-border-strong bg-track p-px">
        <div
          className={`h-full transition-[width] duration-300 ease-linear ${toneBg}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-2">{subline}</p>

      <div className="mt-5 min-h-[180px] border border-border bg-track p-4">
        {lines.map((l) => (
          <div key={l.num} className="flex items-baseline gap-3 py-1.5 [animation:inject_0.22s_cubic-bezier(.2,.8,.2,1)]">
            <span className="flex-none font-mono text-[10px] text-ink-disabled">{l.num}</span>
            <span
              className={`flex-none font-mono text-[10px] ${l.mark === "failed" ? "text-red" : "text-teal"}`}
            >
              {l.mark === "failed" ? "✕" : "✓"}
            </span>
            <span
              className={`flex-1 font-mono text-[10px] tracking-[0.11em] ${l.mark === "failed" ? "text-red" : "text-ink"}`}
            >
              {l.label}
            </span>
            <span
              className={`flex-none font-mono text-[9px] tracking-[0.08em] ${l.mark === "failed" ? "text-red" : "text-ink-3"}`}
            >
              {l.detail}
            </span>
          </div>
        ))}
      </div>

      {failed ? (
        <button
          onClick={retry}
          className="mt-5 w-full cursor-pointer bg-amber px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-amber-hover"
        >
          ▸ RE-ENTER PASSCODE
        </button>
      ) : null}
    </div>
  );
}
