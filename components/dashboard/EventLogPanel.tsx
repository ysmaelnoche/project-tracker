import Link from "next/link";
import { formatStamp } from "@/lib/format";
import type { EventLogRow } from "@/lib/dashboard/build-view";

const TONE_CLASS: Record<EventLogRow["tone"], string> = {
  teal: "text-teal",
  accent: "text-accent",
  quiet: "text-ink-faint",
  red: "text-red",
};

/**
 * "Event Log" (PLAN.md "Recent Activity"): the latest 4 activity rows, with a
 * link through to the full log — /activity is a stub owned by a later slice,
 * but the link is safe to wire up now.
 */
export function EventLogPanel({ rows }: { rows: EventLogRow[] }) {
  return (
    <div className="border border-border bg-surface">
      <div className="flex items-baseline gap-3 border-b border-border px-4 py-3.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink">EVENT LOG</span>
        <Link
          href="/activity"
          className="ml-auto font-mono text-[9px] tracking-[0.14em] text-ink-3 hover:text-accent"
        >
          FULL LOG ▸
        </Link>
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-baseline gap-4 border-b border-divider px-4 py-2.5 last:border-b-0"
        >
          <span className="flex-none basis-[76px] font-mono text-[9px] leading-relaxed tracking-[0.1em] text-ink-faint">
            {formatStamp(row.createdAt.slice(0, 10))}
          </span>
          <span
            className={`flex-none font-mono text-[9px] leading-relaxed tracking-[0.14em] ${TONE_CLASS[row.tone]}`}
          >
            {row.verb}
          </span>
          <span className="min-w-0 flex-1 basis-40 text-[13px] text-ink">{row.subject}</span>
        </div>
      ))}
    </div>
  );
}
