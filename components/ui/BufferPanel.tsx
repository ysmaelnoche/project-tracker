import type { SequenceLine } from "@/lib/ui/sequence";

type Tone = "accent" | "teal" | "red";

const TONE_TEXT: Record<Tone, string> = {
  accent: "text-accent",
  teal: "text-teal",
  red: "text-red",
};
const TONE_BG: Record<Tone, string> = {
  accent: "bg-accent",
  teal: "bg-teal",
  red: "bg-red",
};

/**
 * The shared staged "buffering" panel: a labeled progress bar over a
 * scrolling terminal box of stage lines, each marked done (✓) or failed (✕).
 * This is the visual language every CRUD "COMMITTING" sequence and the
 * GitHub "LINKING" sequence share (see lib/ui/sequence.ts for how `lines`/
 * `percent` are computed from a step list + a revealed count).
 *
 * Modeled on the Access screen's AUTHENTICATING panel (that already-shipped
 * flow keeps its own copy of this markup rather than importing this
 * component, so nothing here can regress sign-in) — same chrome, so the
 * whole app reads as one consistent "buffering" idiom, distinct copy per
 * flow (see e.g. lib/projects/create-sequence.ts).
 */
export function BufferPanel({
  tone,
  eyebrow,
  subline,
  percent,
  lines,
  minHeightPx = 140,
}: {
  tone: Tone;
  eyebrow: string;
  subline: string;
  percent: number;
  lines: SequenceLine[];
  minHeightPx?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={`font-mono text-[9px] tracking-[0.2em] ${TONE_TEXT[tone]}`}>{`// ${eyebrow}`}</span>
        <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint tabular-nums">
          {percent}%
        </span>
      </div>

      <div className="mt-3.5 h-[3px] border border-border-strong bg-track p-px">
        <div
          className={`h-full transition-[width] duration-300 ease-linear ${TONE_BG[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-2">{subline}</p>

      <div className="mt-5 border border-border bg-track p-4" style={{ minHeight: minHeightPx }}>
        {lines.map((l) => (
          <div
            key={l.num}
            className="flex flex-wrap items-baseline gap-3 py-1.5 [animation:inject_0.22s_cubic-bezier(.2,.8,.2,1)]"
          >
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
    </div>
  );
}
