"use client";

import { useSyncExternalStore } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function format(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return format(new Date());
}

// Matches the server-rendered placeholder so there's no hydration mismatch —
// the real time only ever appears after the client subscribes.
function getServerSnapshot() {
  return "";
}

/** Live clock in the header — purely decorative, matches the mockup's ambient telemetry feel. */
export function Clock() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3 tabular-nums">
      {now}
    </span>
  );
}
