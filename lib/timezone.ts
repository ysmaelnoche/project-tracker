/**
 * The operator's own timezone, not the server's. This mattered because
 * every "today" in this app used to be computed either via
 * `new Date().toISOString()` (always UTC) or a `Date`'s own local getters
 * evaluated *on the server* — and a serverless Node runtime's own local
 * timezone (UTC by default on Vercel) has nothing to do with where the
 * operator actually is. Anyone east of UTC would see "today" read as
 * yesterday for several hours after their own local midnight.
 *
 * `components/TimezoneSync.tsx` detects the browser's real IANA timezone
 * and stores it in a cookie named `TIMEZONE_COOKIE`; `lib/timezone-server.ts`
 * reads that cookie server-side. This file holds only the pure part —
 * given a timezone name, what calendar day is it — so it's trivially
 * testable without a request/cookie context.
 */

export const TIMEZONE_COOKIE = "tz";

/** Today's date (YYYY-MM-DD) in a specific IANA timezone — never the server's own. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
