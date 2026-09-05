import Link from "next/link";
import type { DeployedEntry } from "@/lib/dashboard/build-view";

/** "Deployed" (PLAN.md "Production Projects"): most recently published, capped. */
export function DeployedPanel({ projects }: { projects: DeployedEntry[] }) {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5 font-mono text-[10px] tracking-[0.2em] text-ink">
        DEPLOYED
      </div>

      {projects.length > 0 ? (
        <div>
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-baseline gap-3.5 border-b border-divider px-4 py-[15px] last:border-b-0"
            >
              <div className="min-w-0 flex-1 basis-[150px]">
                <Link
                  href={`/projects/${p.id}`}
                  className="font-mono text-sm tracking-[0.05em] text-ink hover:text-teal"
                >
                  {p.name.toUpperCase()}
                </Link>
                <div className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-faint">
                  {p.publishedLabel}
                </div>
              </div>
              <span className="font-mono text-[10px] leading-relaxed tracking-[0.1em] tabular-nums text-teal">
                {p.durationLabel}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-[30px] text-[13px] leading-relaxed text-ink-3">Nothing deployed yet.</div>
      )}
    </div>
  );
}
