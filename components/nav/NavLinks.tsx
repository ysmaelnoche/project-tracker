"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "OVERVIEW" },
  { href: "/projects", label: "FLEET" },
  { href: "/tasks", label: "QUEUE" },
  { href: "/source", label: "SOURCE" },
  { href: "/activity", label: "LOG" },
  { href: "/settings", label: "CONFIG" },
] as const;

/** Shared with MobileNav.tsx so the mobile drawer highlights the same active item. */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors ${
              active ? "bg-surface-hover text-accent" : "text-ink-3 hover:text-ink"
            }`}
          >
            <span className={active ? "text-accent" : "text-transparent"}>[</span>
            {item.label}
            <span className={active ? "text-accent" : "text-transparent"}>]</span>
          </Link>
        );
      })}
    </nav>
  );
}
