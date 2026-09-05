import { AccessForm } from "@/components/auth/AccessForm";

const LIFECYCLE_STAGES = [
  {
    step: "01",
    code: "STANDBY",
    tone: "text-ink-faint",
    note: "Registered. Tasks stay locked until you commit to it.",
  },
  {
    step: "02",
    code: "BUILD",
    tone: "text-accent",
    note: "Tasks unlock, start date recorded, branches bind themselves.",
  },
  {
    step: "03",
    code: "DEPLOYED",
    tone: "text-teal",
    note: "Deploy date captured, build duration computed for you.",
  },
] as const;

export default function AccessPage() {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center overflow-auto bg-bg p-4 sm:p-6">
      <div className="relative grid w-full max-w-[940px] grid-cols-1 border border-border-strong bg-surface sm:grid-cols-2">
        <div className="pointer-events-none absolute -top-px -left-px z-10 h-[13px] w-[13px] border-t border-l border-accent" />
        <div className="pointer-events-none absolute -top-px -right-px z-10 h-[13px] w-[13px] border-t border-r border-accent" />
        <div className="pointer-events-none absolute -bottom-px -left-px z-10 h-[13px] w-[13px] border-b border-l border-accent" />
        <div className="pointer-events-none absolute -bottom-px -right-px z-10 h-[13px] w-[13px] border-b border-r border-accent" />

        {/* Branding / lifecycle panel */}
        <div className="flex min-h-[420px] flex-col gap-7 border-b border-border bg-track p-6 sm:border-r sm:border-b-0 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 animate-[blink_3.4s_ease-in-out_infinite] rounded-full bg-accent shadow-[0_0_10px_rgba(58,192,240,0.85)]" />
            <span className="font-mono text-[13px] font-medium tracking-[0.16em] text-ink">
              SHIPYARD
            </span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
              {"// BUILD CONTROL"}
            </span>
          </div>

          <div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">
              {"// TERMINAL IDLE"}
            </div>
            <div className="mt-4 text-pretty font-mono text-[clamp(21px,2.6vw,27px)] font-light leading-[1.28] tracking-[-0.005em] text-ink">
              Every system you build, on one console.
            </div>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-2">
              Projects move STANDBY → BUILD → DEPLOYED. Commits, branches and pull requests bind
              themselves to tasks, so the log keeps itself.
            </p>
          </div>

          <div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
              {"// LIFECYCLE"}
            </div>
            <div className="mt-3.5 flex flex-col gap-3">
              {LIFECYCLE_STAGES.map((st) => (
                <div key={st.step} className="flex items-baseline gap-3">
                  <span className="flex-none font-mono text-[9px] tracking-[0.12em] text-ink-disabled">
                    {st.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`font-mono text-[10px] tracking-[0.16em] ${st.tone}`}>
                      {st.code}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-ink-3">{st.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-divider pt-4">
            <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
              Ysmael&apos;s SHIPYARD
            </span>
          </div>
        </div>

        {/* Auth panel */}
        <div className="flex min-h-[420px] flex-col justify-center p-6 sm:p-8">
          <AccessForm />
        </div>
      </div>
    </div>
  );
}
