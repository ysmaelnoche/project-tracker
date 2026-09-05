"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { href: "/projects/new", label: "Lay a keel", hint: "NEW PROJECT · ENTERS ON STANDBY" },
  { href: "/tasks/new", label: "New standalone task", hint: "NO PROJECT REQUIRED" },
  { href: "/tasks/new?context=project", label: "New project task", hint: "ACTIVE BUILDS ONLY" },
];

export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer bg-accent px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-bg transition-colors hover:bg-accent-hover"
      >
        + NEW
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[262px] animate-[fade_0.13s_ease] border border-border-strong bg-surface-raised shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)]">
          <div className="border-b border-border px-3.5 py-2.5 font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            {"// NEW RECORD"}
          </div>
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-divider px-3.5 py-2.5 hover:bg-surface-hover"
            >
              <div className="font-mono text-[11px] tracking-[0.08em] text-ink">
                {item.label}
              </div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.1em] text-ink-faint">
                {item.hint}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
