import Link from "next/link";
import type { StandbyEntry } from "@/lib/dashboard/build-view";

/** "Standby" (PLAN.md "Pending Projects"): projects that haven't started development. */
export function StandbyPanel({ projects }: { projects: StandbyEntry[] }) {
  return (
    <div className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5 font-mono text-[10px] tracking-[0.2em] text-ink">
        STANDBY
      </div>

      {projects.length > 0 ? (
        <div>
          {projects.map((p) => (
            <div key={p.id} className="border-b border-divider px-4 py-[15px] last:border-b-0">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{p.ref}</span>
                <Link
                  href={`/projects/${p.id}`}
                  className="font-mono text-sm tracking-[0.05em] text-ink hover:text-amber"
                >
                  {p.name.toUpperCase()}
                </Link>
              </div>
              <div className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-ink-faint">
                {p.type === "personal" ? "PERSONAL" : "WORK"} · TASKS LOCKED
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-[30px] text-[13px] leading-relaxed text-ink-3">Nothing on standby.</div>
      )}
    </div>
  );
}
