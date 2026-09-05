import "server-only";
import { cookies } from "next/headers";
import { TIMEZONE_COOKIE, todayInTimezone } from "@/lib/timezone";

const FALLBACK_TIMEZONE = "UTC";

/**
 * The operator's timezone, read from the cookie `components/TimezoneSync.tsx`
 * sets client-side. Falls back to UTC only for the brief window before that
 * cookie exists at all (the very first request ever, or right after cookies
 * are cleared) — every request after that first sync is accurate.
 */
export async function getOperatorTimezone(): Promise<string> {
  const store = await cookies();
  return store.get(TIMEZONE_COOKIE)?.value || FALLBACK_TIMEZONE;
}

/**
 * Today's date (YYYY-MM-DD) in the operator's own timezone. Use this —
 * never `new Date().toISOString().slice(0, 10)` or a `Date`'s own local
 * getters — anywhere a Server Component or Server Action needs "today":
 * the server process's own timezone is a different, irrelevant thing.
 */
export async function getTodayIso(): Promise<string> {
  return todayInTimezone(await getOperatorTimezone());
}
