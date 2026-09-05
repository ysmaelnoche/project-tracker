import { Panel, PanelHeader, PanelTitle } from "@/components/ui/Panel";
import { formatStamp } from "@/lib/format";
import type { ActivityEvent, ActivityTone } from "@/lib/types";

const TONE_INK: Record<ActivityTone, string> = {
  amber: "text-amber",
  teal: "text-teal",
  red: "text-red",
  quiet: "text-ink-faint",
};

function formatWhen(iso: string): string {
  const date = formatStamp(iso.slice(0, 10));
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}

/** Project-scoped slice of the app-wide activity_log (PLAN.md "Recent Activity"). */
export function ProjectActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>EVENT LOG</PanelTitle>
      </PanelHeader>
      {events.length === 0 ? (
        <div className="px-4 py-6 text-sm text-ink-3">Nothing logged yet.</div>
      ) : (
        <div>
          {events.map((event) => (
            <div key={event.id} className="border-b border-divider px-4 py-2.5 last:border-b-0">
              <div className="font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                {formatWhen(event.createdAt)} ·{" "}
                <span className={TONE_INK[event.tone]}>{event.verb}</span>
              </div>
              <div className="mt-1.5 text-sm text-ink">{event.subject}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
