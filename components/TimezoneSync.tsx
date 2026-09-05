"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_COOKIE } from "@/lib/timezone";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Detects the browser's real IANA timezone and stores it in a cookie every
 * Server Component/Action reads "today" through (lib/timezone-server.ts).
 * Renders nothing. Only writes the cookie and refreshes when the detected
 * zone actually differs from what's stored — a no-op on every normal visit
 * once synced once, and self-correcting if the operator travels.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || readCookie(TIMEZONE_COOKIE) === detected) return;
    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(detected)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
