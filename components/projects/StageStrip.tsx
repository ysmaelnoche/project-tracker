import { deriveStageStrip } from "@/lib/projects/lifecycle";
import type { Project } from "@/lib/types";

const STATE_INK: Record<"done" | "active" | "upcoming", string> = {
  done: "text-ink-3",
  active: "text-accent",
  upcoming: "text-ink-disabled",
};

const VALUE_INK: Record<"done" | "active" | "upcoming", string> = {
  done: "text-ink-2",
  active: "text-ink",
  upcoming: "text-ink-disabled",
};

/** The Standby / Build / Deployed strip on Project Detail. */
export function StageStrip({
  project,
  today,
}: {
  project: Pick<Project, "status" | "devStartDate" | "publishedDate" | "targetDate">;
  today: string;
}) {
  const stages = deriveStageStrip(project, today);
  const deployedActive = stages[2]?.state === "active";

  return (
    <div className="mt-3 grid grid-cols-1 border border-border bg-surface sm:grid-cols-3">
      {stages.map((st, i) => {
        const ink = st.state === "active" && i === 2 && deployedActive ? "text-teal" : STATE_INK[st.state];
        return (
          <div
            key={st.code}
            className="border-b border-divider px-[18px] py-4 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-[9px] tracking-[0.16em] ${ink}`}>{st.step}</span>
              <span className={`font-mono text-[9px] tracking-[0.16em] ${ink}`}>{st.code}</span>
            </div>
            <div
              className={`mt-2.5 font-mono text-[15px] tracking-[0.02em] tabular-nums ${VALUE_INK[st.state]}`}
            >
              {st.value}
            </div>
            <div className="mt-1.5 font-mono text-[9px] tracking-[0.11em] text-ink-faint">
              {st.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
