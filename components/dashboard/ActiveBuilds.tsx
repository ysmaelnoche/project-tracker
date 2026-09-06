import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import type { ActiveBuildCard } from "@/lib/dashboard/build-view";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Active Builds (PLAN.md "Active Projects"): one card per in-development project. */
export function ActiveBuilds({ cards }: { cards: ActiveBuildCard[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3 border-b border-border pb-[11px]">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink">ACTIVE BUILDS</span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {pad2(cards.length)} IN BAY
        </span>
      </div>

      {cards.length > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2.5">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/projects/${card.id}`}
              className="block cursor-pointer border border-border bg-surface-raised p-[clamp(16px,2vw,22px)] transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <div className="flex flex-wrap items-baseline gap-3.5">
                <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">{card.ref}</span>
                <h3 className="m-0 font-mono text-[clamp(15px,1.8vw,18px)] tracking-[0.05em] text-ink">
                  {card.name.toUpperCase()}
                </h3>
                <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
                  {card.type === "personal" ? "PERSONAL" : "WORK"}
                </span>
                <PriorityBadge priority={card.priority} />
                <span className="ml-auto font-mono text-[9px] tracking-[0.14em] text-accent">● BUILD</span>
              </div>

              {card.description ? (
                <p className="mt-2.5 max-w-[66ch] text-[13px] leading-relaxed text-ink-2">
                  {card.description}
                </p>
              ) : null}

              <div className="mt-5 font-mono text-[9px] leading-relaxed tracking-[0.13em] text-ink-3">
                {card.metaLine}
                {card.githubSnippet ? ` · ${card.githubSnippet}` : ""}
              </div>

              {card.nextTaskTitle ? (
                <div className="mt-4 flex flex-wrap items-baseline gap-3 border-t border-divider pt-3.5">
                  <span className="font-mono text-[9px] leading-relaxed tracking-[0.16em] text-accent">
                    ▸ NEXT
                  </span>
                  <span className="text-sm text-ink">{card.nextTaskTitle}</span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3.5">
          <EmptyState
            eyebrow="NO ACTIVE BUILDS"
            title="All bays are empty."
            body="Initiate a build on a standby project, or lay a new keel."
            action={
              <Link
                href="/projects/new"
                className="inline-block cursor-pointer bg-accent px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-accent-hover"
              >
                + LAY KEEL
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
