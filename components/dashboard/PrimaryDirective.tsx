"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { toggleTaskStatus } from "@/lib/tasks/actions";
import type { PrimaryDirective as PrimaryDirectiveData } from "@/lib/dashboard/directive";

/**
 * The Overview's headline block (PLAN.md "Next Action"): the single most
 * urgent thing across every active build. The caller omits this component
 * entirely when there's no active project with an open task — see
 * `pickPrimaryDirective` in `lib/dashboard/directive.ts`.
 */
export function PrimaryDirective({ directive }: { directive: PrimaryDirectiveData }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function complete() {
    startTransition(async () => {
      try {
        const result = await toggleTaskStatus(directive.task.id);
        if (!result.ok) {
          toast.show({ label: "TASK ERROR", message: result.error, tone: "red" });
          return;
        }
        toast.show({
          label: result.done ? "TASK COMPLETE" : "TASK REOPENED",
          message: result.done
            ? `"${directive.task.title}" closed.`
            : `"${directive.task.title}" is back in the queue.`,
          tone: result.done ? "teal" : "amber",
        });
        router.refresh();
      } catch {
        toast.show({ label: "TASK ERROR", message: "Something went wrong. Try again.", tone: "red" });
      }
    });
  }

  return (
    <div className="relative border border-border-strong bg-surface-raised p-[clamp(20px,3vw,30px)]">
      <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-amber" />
      <div className="pointer-events-none absolute -top-px -right-px h-[11px] w-[11px] border-t border-r border-amber" />
      <div className="pointer-events-none absolute -bottom-px -left-px h-[11px] w-[11px] border-b border-l border-amber" />
      <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-amber" />

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-[9px] tracking-[0.2em] text-amber">▸ PRIMARY DIRECTIVE</span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {directive.projectRef} · {directive.projectName.toUpperCase()}
        </span>
      </div>

      <div className="mt-[18px] flex flex-wrap items-end gap-6">
        <div className="min-w-0 flex-1 basis-[300px]">
          <div className="font-mono text-[clamp(22px,3vw,30px)] font-light leading-[1.2] tracking-[-0.02em] text-ink">
            {directive.task.title}
          </div>
          <div className="mt-[11px] font-mono text-[10px] tracking-[0.14em] text-ink-2">{directive.meta}</div>
        </div>
        <div className="flex flex-none flex-wrap gap-2">
          <button
            onClick={complete}
            disabled={isPending}
            className="cursor-pointer bg-amber px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            MARK COMPLETE
          </button>
          <Link
            href={`/projects/${directive.projectId}`}
            className="cursor-pointer border border-border-strong px-4 py-2.5 font-mono text-[10px] tracking-[0.13em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
          >
            OPEN PROJECT
          </Link>
        </div>
      </div>
    </div>
  );
}
