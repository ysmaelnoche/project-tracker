"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { buildPaletteEntries, type PaletteProjectInput, type PaletteTaskInput } from "@/lib/palette/entries";
import { searchPalette } from "@/lib/palette/search";
import type { PaletteEntry, PaletteGroupLabel } from "@/lib/palette/types";

const GROUP_TITLES: Record<PaletteGroupLabel, string> = {
  FLEET: "FLEET",
  QUEUE: "QUEUE",
  COMMANDS: "COMMANDS",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Global ⌘K command palette — searches projects, open tasks, and a fixed
 * command list (PLAN.md "Search and Command Palette"). Mounted once in
 * `app/(app)/layout.tsx`. Opens via the shared `shipyard:open-palette` DOM
 * event (dispatched by `components/nav/PaletteTrigger.tsx`) and also binds
 * Ctrl/Cmd+K itself, since the trigger button is just one entry point.
 * Follows the same fixed-overlay + stopPropagation idiom as
 * `components/ui/ConfirmDialog.tsx`.
 */
export function CommandPalette({
  projects,
  tasks,
}: {
  projects: PaletteProjectInput[];
  tasks: PaletteTaskInput[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);

  const entries = useMemo(() => buildPaletteEntries({ projects, tasks }), [projects, tasks]);
  const result = useMemo(() => searchPalette(entries, query), [entries, query]);

  function openPalette() {
    setQuery("");
    setSel(0);
    setOpen(true);
  }

  function closePalette() {
    setOpen(false);
  }

  function execute(entry: PaletteEntry) {
    closePalette();
    router.push(entry.target);
  }

  useEffect(() => {
    document.addEventListener("shipyard:open-palette", openPalette);
    return () => document.removeEventListener("shipyard:open-palette", openPalette);
  }, []);

  // Read the latest open/result/sel from a ref instead of re-subscribing the
  // keydown listener on every keystroke (`result` changes as the user types).
  const latest = useRef({ open, result, sel });
  useEffect(() => {
    latest.current = { open, result, sel };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const { open, result, sel } = latest.current;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) closePalette();
        else openPalette();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel(Math.min(sel + 1, Math.max(result.flat.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel(Math.max(sel - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const entry = result.flat[sel];
        if (entry) execute(entry);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads via `latest` ref, deliberately mount-only
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSel(0);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-start justify-center overflow-auto bg-black/72 px-5 pb-5 pt-[clamp(44px,11vh,130px)] animate-[fade_0.12s_ease]"
      onClick={closePalette}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[580px] animate-[lift_0.16s_cubic-bezier(0.2,0.8,0.2,1)] border border-border-strong bg-surface-raised shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-[18px] py-[15px]">
          <span className="font-mono text-sm text-accent">▸</span>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search the fleet, queue, or a command…"
            aria-label="Search projects, tasks, and commands"
            autoFocus
            className="flex-1 border-0 bg-transparent font-mono text-[15px] tracking-[0.01em] text-ink outline-none placeholder:text-ink-faint"
          />
          <span className="font-mono text-[9px] tracking-[0.12em] text-ink-faint">ESC</span>
        </div>

        <div className="max-h-[min(52vh,420px)] overflow-auto">
          {result.groups.map((group) => (
            <div key={group.label}>
              <div className="px-[18px] pb-1.5 pt-2.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">
                {`// ${GROUP_TITLES[group.label]}`}
              </div>
              {group.items.map((item) => {
                const index = result.flat.indexOf(item);
                const active = index === sel;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSel(index)}
                    onClick={() => execute(item)}
                    className={`flex w-full cursor-pointer items-center gap-3 border-0 border-l-2 px-[18px] py-[11px] text-left transition-colors ${
                      active ? "border-l-accent bg-surface-hover" : "border-l-transparent bg-transparent"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{item.label}</span>
                    <span className="flex-none font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                      {item.meta}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {result.isEmpty ? (
            <div className="px-[18px] py-[42px]">
              <div className="font-mono text-[9px] tracking-[0.18em] text-red">{"// NO MATCH"}</div>
              <div className="mt-3 font-mono text-[17px] font-light text-ink">
                {`Nothing for “${query}”.`}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-4 border-t border-border bg-surface px-[18px] py-2.5 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
          <span>↑↓ SELECT</span>
          <span>↵ EXECUTE</span>
          <span className="ml-auto">{`${pad2(result.flat.length)} RESULTS`}</span>
        </div>
      </div>
    </div>
  );
}
