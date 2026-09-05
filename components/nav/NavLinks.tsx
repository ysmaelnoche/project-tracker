"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "OVERVIEW" },
  { href: "/projects", label: "FLEET" },
  { href: "/tasks", label: "QUEUE" },
  { href: "/source", label: "SOURCE" },
  { href: "/activity", label: "LOG" },
  { href: "/settings", label: "CONFIG" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-0.5">
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/projects" && pathname.startsWith("/projects/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors ${
              active ? "bg-surface-hover text-amber" : "text-ink-3 hover:text-ink"
            }`}
          >
            <span className={active ? "text-amber" : "text-transparent"}>[</span>
            {item.label}
            <span className={active ? "text-amber" : "text-transparent"}>]</span>
          </Link>
        );
      })}
    </nav>
  );
}
