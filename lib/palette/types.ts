/**
 * Shared shapes for the command palette's search index. Kept separate from
 * `search.ts`/`entries.ts` so tests and the component can import just the
 * types without pulling in logic.
 */

export type PaletteGroupLabel = "FLEET" | "QUEUE" | "COMMANDS";

/**
 * One searchable/executable row. `target` is a plain href string (not a
 * closure) so the matching/ranking logic in `search.ts` stays pure and
 * trivially testable — the component is the only thing that turns a `target`
 * into an actual navigation.
 */
export interface PaletteEntry {
  id: string;
  group: PaletteGroupLabel;
  label: string;
  /** Extra text matched against the query but not shown (e.g. a project ref). */
  keywords?: string;
  /** Right-aligned meta text (stage, "STANDALONE", "CREATE", "JUMP", ...). */
  meta: string;
  /** Route to navigate to when this entry is executed. */
  target: string;
}

export interface PaletteResultGroup {
  label: PaletteGroupLabel;
  items: PaletteEntry[];
}

export interface PaletteSearchResult {
  query: string;
  flat: PaletteEntry[];
  groups: PaletteResultGroup[];
  isEmpty: boolean;
}
