import type { UpcomingEntry } from "@/lib/dashboard/schedule";

/** "Inbound" (PLAN.md "Upcoming"): future tasks plus active-project milestones. */
export function UpcomingPanel({ entries }: { entries: UpcomingEntry[] }) {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5 font-mono text-[10px] tracking-[0.2em] text-ink">
        INBOUND
      </div>

      {entries.length > 0 ? (
        <div>
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline gap-3.5 border-b border-divider px-4 py-3 last:border-b-0"
            >
              <span className="flex-none basis-[72px] font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-3">
                {entry.when}
              </span>
              <span
                className={`min-w-0 flex-1 basis-40 text-sm ${entry.isMilestone ? "text-amber" : "text-ink"}`}
              >
                {entry.title}
              </span>
              <span className="font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-faint">
                {entry.ctx}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-[18px] py-8 text-[13px] leading-relaxed text-ink-3">
          No scheduled inbound items.
        </div>
      )}
    </div>
  );
}
