import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { groupActivityByDay } from "@/lib/activity/group";
import { listRecentActivity } from "@/lib/activity/queries";
import type { ActivityEvent, ActivityTone } from "@/lib/types";

// PLAN.md "Recent Activity": the full chronological activity_log, newest
// first, capped rather than infinite-scrolled ("do not create an enterprise
// audit log"). See the Shipyard mockup's `data-screen-label="Log"` section.
const ACTIVITY_LIMIT = 100;

const TONE_INK: Record<ActivityTone, string> = {
  accent: "text-accent",
  teal: "text-teal",
  red: "text-red",
  quiet: "text-ink-faint",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function ActivityPage() {
  let events: ActivityEvent[] = [];
  let loadFailed = false;
  try {
    events = await listRecentActivity(ACTIVITY_LIMIT);
  } catch {
    // A failed read here should never take down the rest of the tracker
    // (PLAN.md "Error States") — show a friendly empty state instead.
    loadFailed = true;
  }

  const groups = groupActivityByDay(events);

  return (
    <div>
      <h1 className="m-0 font-mono text-[clamp(24px,3.4vw,32px)] font-light tracking-[0.02em] text-ink">
        EVENT LOG
      </h1>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-ink-2">
        Every state change the system recorded on your behalf. None of it was entered by hand.
      </p>

      <div className="mt-6">
        {loadFailed ? (
          <EmptyState
            eyebrow="LOG UNAVAILABLE"
            title="The event log couldn't be loaded."
            body="Your project and task data are unaffected. Try refreshing in a moment."
          />
        ) : events.length === 0 ? (
          <EmptyState
            eyebrow="NO RECORDS"
            title="Nothing logged yet."
            body="Status changes, task completions, and build events will appear here automatically."
          />
        ) : (
          <>
            <Panel className="overflow-hidden">
              {groups.map((group) => (
                <div key={`${group.label}-${group.events[0]?.id ?? ""}`}>
                  <div className="border-b border-divider bg-track px-4 py-2 font-mono text-[9px] tracking-[0.18em] text-ink-faint">
                    {group.label}
                  </div>
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-baseline gap-4 border-b border-divider px-4 py-3 last:border-b-0"
                    >
                      <span className="flex-none basis-[54px] font-mono text-[9px] tracking-[0.1em] text-ink-faint">
                        {formatTime(event.createdAt)}
                      </span>
                      <span
                        className={`flex-none basis-[150px] font-mono text-[9px] tracking-[0.14em] ${TONE_INK[event.tone]}`}
                      >
                        {event.verb}
                      </span>
                      <span className="min-w-0 flex-1 basis-[180px] truncate text-sm text-ink">
                        {event.subject}
                      </span>
                      {event.contextRef ? (
                        <span className="flex-none font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                          {event.contextRef}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </Panel>
            {events.length === ACTIVITY_LIMIT ? (
              <p className="mt-3 font-mono text-[9px] tracking-[0.14em] text-ink-faint">
                {`SHOWING THE MOST RECENT ${ACTIVITY_LIMIT} RECORDS`}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
