/**
 * Pure day-grouping for the Activity/Event Log screen. No I/O — the page
 * fetches events newest-first via `lib/activity/queries.ts` and groups them
 * here for display. Assumes the input is already sorted newest-first (which
 * is how the query orders it); grouping does not re-sort.
 */
import { pad2 } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";

export interface ActivityDayGroup {
  label: string;
  events: ActivityEvent[];
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Groups events by local calendar day, labelling today/yesterday specially
 * and falling back to a dotted date stamp ("2026.08.20") for anything older.
 * `now` is a parameter (default: current time) so this stays deterministic
 * in tests.
 */
export function groupActivityByDay(events: ActivityEvent[], now: Date = new Date()): ActivityDayGroup[] {
  const todayKey = localDayKey(now);
  const yesterdayKey = localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  const groups: ActivityDayGroup[] = [];
  const byKey = new Map<string, ActivityDayGroup>();

  for (const event of events) {
    const key = localDayKey(new Date(event.createdAt));
    let group = byKey.get(key);
    if (!group) {
      const label = key === todayKey ? "TODAY" : key === yesterdayKey ? "YESTERDAY" : key.replaceAll("-", ".");
      group = { label, events: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.events.push(event);
  }

  return groups;
}
