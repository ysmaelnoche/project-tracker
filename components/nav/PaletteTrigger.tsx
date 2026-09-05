"use client";

/**
 * Stub ⌘K trigger. The command palette overlay itself (fuzzy search over projects,
 * tasks, and PRs) is a separate, self-contained piece — see CommandPalette.tsx.
 * This button just dispatches a DOM event so it can be wired up without Header
 * needing to know about the palette's internal state.
 */
export function PaletteTrigger() {
  return (
    <button
      onClick={() => document.dispatchEvent(new CustomEvent("shipyard:open-palette"))}
      className="cursor-pointer border border-border px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-ink-2 transition-colors hover:border-accent hover:text-accent"
    >
      ⌘K
    </button>
  );
}
