import { describe, expect, it } from "vitest";
import { searchPalette } from "@/lib/palette/search";
import type { PaletteEntry } from "@/lib/palette/types";

function entry(overrides: Partial<PaletteEntry>): PaletteEntry {
  return {
    id: "e1",
    group: "COMMANDS",
    label: "Untitled",
    meta: "",
    target: "/",
    ...overrides,
  };
}

describe("searchPalette", () => {
  it("returns every entry, grouped, for an empty query", () => {
    const entries = [
      entry({ id: "p1", group: "FLEET", label: "PRJ-01  Shipyard" }),
      entry({ id: "t1", group: "QUEUE", label: "Finish the gauge" }),
      entry({ id: "c1", group: "COMMANDS", label: "New project" }),
    ];
    const result = searchPalette(entries, "");
    expect(result.isEmpty).toBe(false);
    expect(result.flat.map((e) => e.id)).toEqual(["p1", "t1", "c1"]);
    expect(result.groups.map((g) => g.label)).toEqual(["FLEET", "QUEUE", "COMMANDS"]);
  });

  it("matches case-insensitively against the label", () => {
    const entries = [entry({ id: "p1", group: "FLEET", label: "PRJ-01  Shipyard" })];
    expect(searchPalette(entries, "shipyard").flat.map((e) => e.id)).toEqual(["p1"]);
    expect(searchPalette(entries, "SHIPYARD").flat.map((e) => e.id)).toEqual(["p1"]);
  });

  it("matches a substring anywhere in the label", () => {
    const entries = [entry({ id: "p1", group: "FLEET", label: "PRJ-01  Shipyard" })];
    expect(searchPalette(entries, "yar").flat.map((e) => e.id)).toEqual(["p1"]);
  });

  it("also matches against keywords, even when not shown in the label", () => {
    const entries = [
      entry({ id: "p1", group: "FLEET", label: "Shipyard", keywords: "PRJ-01" }),
    ];
    expect(searchPalette(entries, "prj-01").flat.map((e) => e.id)).toEqual(["p1"]);
  });

  it("excludes entries that match neither label nor keywords", () => {
    const entries = [
      entry({ id: "p1", group: "FLEET", label: "Shipyard" }),
      entry({ id: "p2", group: "FLEET", label: "Orbit" }),
    ];
    expect(searchPalette(entries, "orb").flat.map((e) => e.id)).toEqual(["p2"]);
  });

  it("reports isEmpty and no groups when nothing matches", () => {
    const entries = [entry({ id: "p1", group: "FLEET", label: "Shipyard" })];
    const result = searchPalette(entries, "zzz-no-match");
    expect(result.isEmpty).toBe(true);
    expect(result.flat).toEqual([]);
    expect(result.groups).toEqual([]);
  });

  it("caps FLEET and QUEUE results but keeps input order within a group", () => {
    const fleet = Array.from({ length: 8 }, (_, i) => entry({ id: `p${i}`, group: "FLEET", label: `Project ${i}` }));
    const result = searchPalette(fleet, "");
    expect(result.flat).toHaveLength(5);
    expect(result.flat.map((e) => e.id)).toEqual(["p0", "p1", "p2", "p3", "p4"]);
  });

  it("does not cap COMMANDS", () => {
    const commands = Array.from({ length: 12 }, (_, i) => entry({ id: `c${i}`, group: "COMMANDS", label: `Command ${i}` }));
    const result = searchPalette(commands, "");
    expect(result.flat).toHaveLength(12);
  });

  it("always orders groups FLEET, then QUEUE, then COMMANDS regardless of input order", () => {
    const entries = [
      entry({ id: "c1", group: "COMMANDS", label: "New project" }),
      entry({ id: "t1", group: "QUEUE", label: "Finish the gauge" }),
      entry({ id: "p1", group: "FLEET", label: "Shipyard" }),
    ];
    const result = searchPalette(entries, "");
    expect(result.groups.map((g) => g.label)).toEqual(["FLEET", "QUEUE", "COMMANDS"]);
    expect(result.flat.map((e) => e.id)).toEqual(["p1", "t1", "c1"]);
  });

  it("omits a group entirely from `groups` when it has no matches", () => {
    const entries = [
      entry({ id: "p1", group: "FLEET", label: "Shipyard" }),
      entry({ id: "c1", group: "COMMANDS", label: "New project" }),
    ];
    const result = searchPalette(entries, "shipyard");
    expect(result.groups.map((g) => g.label)).toEqual(["FLEET"]);
  });

  it("trims surrounding whitespace on the query", () => {
    const entries = [entry({ id: "p1", group: "FLEET", label: "Shipyard" })];
    expect(searchPalette(entries, "  shipyard  ").flat.map((e) => e.id)).toEqual(["p1"]);
  });
});
