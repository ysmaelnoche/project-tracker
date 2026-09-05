"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SCOPES = [
  { value: "all", label: "ALL" },
  { value: "personal", label: "PERSONAL" },
  { value: "work", label: "WORK" },
] as const;

/**
 * Personal/Work scope filter, shared across Dashboard and Fleet. Lives in the URL
 * (`?scope=`) rather than client state so it survives navigation/reload and every
 * page can read it server-side.
 */
export function ScopeBar({ statusLine }: { statusLine: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("scope") ?? "all";

  function setScope(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("scope");
    else params.set("scope", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="border-t border-divider bg-[#0a0d11]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-4 px-4 py-1.5 sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">SCOPE</span>
        <div className="flex gap-3">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              className={`cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em] ${
                current === s.value ? "text-accent" : "text-ink-3"
              }`}
            >
              {current === s.value ? "◆" : "◇"} {s.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[9px] tracking-[0.13em] text-ink-faint">
          {statusLine}
        </span>
      </div>
    </div>
  );
}
