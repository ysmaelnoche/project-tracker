"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProjectStatus, ProjectType } from "@/lib/types";

type ClassValue = "all" | ProjectType;
type StageValue = "all" | ProjectStatus;

const CLASS_OPTIONS: Array<{ value: ClassValue; label: string }> = [
  { value: "all", label: "ALL" },
  { value: "personal", label: "PERSONAL" },
  { value: "work", label: "WORK" },
];

const STAGE_OPTIONS: Array<{ value: StageValue; label: string }> = [
  { value: "all", label: "ALL" },
  { value: "pending", label: "STANDBY" },
  { value: "in_development", label: "BUILD" },
  { value: "production", label: "DEPLOYED" },
  { value: "paused", label: "HOLD" },
  { value: "archived", label: "DECOMM" },
];

/**
 * Fleet's own class/stage filters (PLAN.md "Projects View"). Lives in the URL
 * (`?class=`, `?stage=`) — same pattern as the shared ScopeBar's `?scope=`, which
 * this page layers on top rather than replaces.
 */
export function FleetFilters({
  classFilter,
  stageFilter,
  stageCounts,
}: {
  classFilter: ClassValue;
  stageFilter: StageValue;
  stageCounts: Record<StageValue, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: "class" | "stage", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mt-5 flex flex-wrap gap-6 border border-border bg-surface px-4 py-3.5 sm:gap-9">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">CLASS</span>
        {CLASS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam("class", opt.value)}
            className={`cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em] ${
              classFilter === opt.value ? "text-accent" : "text-ink-3"
            }`}
          >
            {classFilter === opt.value ? "◆" : "◇"} {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">STAGE</span>
        {STAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam("stage", opt.value)}
            className={`cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.13em] ${
              stageFilter === opt.value ? "text-accent" : "text-ink-3"
            }`}
          >
            {opt.label} <span className="text-ink-faint">{String(stageCounts[opt.value]).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
