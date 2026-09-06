"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clock } from "./Clock";
import { PaletteTrigger } from "./PaletteTrigger";
import { NAV_ITEMS, isNavActive } from "./NavLinks";

/**
 * Collapsed nav for viewports below `lg:` (1024px) — the point below which the
 * full inline logo + six-link NavLinks + Clock/⌘K/+NEW row stops comfortably
 * fitting on one line, a portrait iPad (768–834px) included. Below that, only
 * the logo, this toggle, and QuickCreate stay in the header itself; tapping
 * the toggle drops down the same six links stacked full-width, plus the
 * otherwise-hidden Clock/⌘K.
 *
 * Positioned `absolute` off `<header>` (the nearest `position` ancestor, since
 * `sticky` counts) rather than off this component's own wrapper, so the panel
 * spans the header's full width regardless of where the toggle button sits.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on navigation — adjusted during render (matching TaskQueueList's/
  // MyDayPanel's own resync-on-new-props pattern) rather than in an effect,
  // so it doesn't fire a redundant extra render on every mount.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

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
    <div ref={ref} className="lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex cursor-pointer flex-col items-center justify-center gap-[3px] border border-border-strong px-2.5 py-2.5 transition-colors hover:border-accent"
      >
        <span
          className={`h-px w-4 bg-ink-2 transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`}
        />
        <span className={`h-px w-4 bg-ink-2 transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`h-px w-4 bg-ink-2 transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 border-b border-border-strong bg-bg shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)]">
          <nav className="mx-auto flex max-w-[1320px] flex-col px-4 py-1 sm:px-8">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 border-b border-divider py-3.5 font-mono text-[12px] tracking-[0.14em] last:border-b-0 ${
                    active ? "text-accent" : "text-ink-2"
                  }`}
                >
                  <span className={active ? "text-accent" : "text-transparent"}>[</span>
                  {item.label}
                  <span className={active ? "text-accent" : "text-transparent"}>]</span>
                </Link>
              );
            })}
            <div className="flex items-center justify-between gap-3 py-3.5">
              <Clock />
              <PaletteTrigger />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
