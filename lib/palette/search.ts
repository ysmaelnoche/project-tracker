/**
 * Pure matching/ranking for the command palette. No I/O, no React — takes a
 * flat list of already-built {@link PaletteEntry} rows plus the current query
 * string and returns them filtered and grouped for rendering. The palette
 * component (`components/CommandPalette.tsx`) just calls this on every
 * keystroke and renders the result; `lib/palette/entries.ts` is what turns
 * projects/tasks/commands into the flat input list.
 *
 * Matching is a simple case-insensitive substring match against the label
 * and an optional `keywords` string (e.g. a project ref) — mirrors the
 * reference's `hit()` (design/Shipyard.reference.html, search "paletteFlat").
 * An empty query matches everything, same as the reference.
 */
import type { PaletteEntry, PaletteGroupLabel, PaletteResultGroup, PaletteSearchResult } from "@/lib/palette/types";

const GROUP_ORDER: PaletteGroupLabel[] = ["FLEET", "QUEUE", "COMMANDS"];

// Caps mirror the reference (5 projects, 5 open tasks); COMMANDS is a small
// fixed list so it isn't capped.
const GROUP_LIMITS: Record<PaletteGroupLabel, number> = {
  FLEET: 5,
  QUEUE: 5,
  COMMANDS: Infinity,
};

function matches(entry: PaletteEntry, query: string): boolean {
  if (!query) return true;
  const haystack = `${entry.label} ${entry.keywords ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

export function searchPalette(entries: PaletteEntry[], rawQuery: string): PaletteSearchResult {
  const query = rawQuery.trim().toLowerCase();

  const byGroup = new Map<PaletteGroupLabel, PaletteEntry[]>();
  for (const entry of entries) {
    if (!matches(entry, query)) continue;
    const list = byGroup.get(entry.group);
    if (list) list.push(entry);
    else byGroup.set(entry.group, [entry]);
  }

  const groups: PaletteResultGroup[] = [];
  const flat: PaletteEntry[] = [];
  for (const label of GROUP_ORDER) {
    const items = (byGroup.get(label) ?? []).slice(0, GROUP_LIMITS[label]);
    if (items.length === 0) continue;
    groups.push({ label, items });
    flat.push(...items);
  }

  return { query: rawQuery, flat, groups, isEmpty: flat.length === 0 };
}
