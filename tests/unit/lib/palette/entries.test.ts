import { describe, expect, it } from "vitest";
import { buildPaletteEntries, PALETTE_COMMANDS } from "@/lib/palette/entries";

describe("buildPaletteEntries", () => {
  const projects = [
    { id: "proj-1", ref: "PRJ-01", name: "Shipyard", status: "in_development" as const },
    { id: "proj-2", ref: "PRJ-06", name: "Halyard", status: "pending" as const },
  ];
  const tasks = [
    { id: "task-1", ref: "TSK-0102", title: "Row-level security policies", projectId: "proj-1", status: "todo" as const },
    { id: "task-2", ref: "TSK-0103", title: "Command palette shell", projectId: "proj-1", status: "done" as const },
    { id: "task-3", ref: "TSK-9001", title: "Send follow-up email", projectId: null, status: "todo" as const },
  ];

  it("builds a FLEET entry per project, labelled with ref + name and targeting the project page", () => {
    const entries = buildPaletteEntries({ projects, tasks: [] });
    const fleet = entries.filter((e) => e.group === "FLEET");
    expect(fleet).toHaveLength(2);
    expect(fleet[0]).toMatchObject({
      label: "PRJ-01  Shipyard",
      target: "/projects/proj-1",
      meta: "BUILD",
    });
    expect(fleet[0]?.keywords).toContain("PRJ-01");
  });

  it("builds a QUEUE entry per open task, excluding done tasks", () => {
    const entries = buildPaletteEntries({ projects, tasks });
    const queue = entries.filter((e) => e.group === "QUEUE");
    expect(queue.map((e) => e.label)).toEqual(["Row-level security policies", "Send follow-up email"]);
  });

  it("targets a project task's parent project page", () => {
    const entries = buildPaletteEntries({ projects, tasks });
    const row = entries.find((e) => e.id === "task-task-1");
    expect(row).toMatchObject({ target: "/projects/proj-1", meta: "PRJ-01" });
  });

  it("targets the Queue screen for a standalone task", () => {
    const entries = buildPaletteEntries({ projects, tasks });
    const row = entries.find((e) => e.id === "task-task-3");
    expect(row).toMatchObject({ target: "/tasks", meta: "STANDALONE" });
  });

  it("always includes the fixed COMMANDS list", () => {
    const entries = buildPaletteEntries({ projects: [], tasks: [] });
    const commands = entries.filter((e) => e.group === "COMMANDS");
    expect(commands.map((c) => c.label)).toEqual(PALETTE_COMMANDS.map((c) => c.label));
  });

  it("includes the commands PLAN.md calls out by name", () => {
    const labels = PALETTE_COMMANDS.map((c) => c.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "New project",
        "New standalone task",
        "New project task",
        "Overview",
        "Fleet",
        "Queue",
        "Source",
        "Log",
        "Config",
        "Link a repository",
      ]),
    );
  });
});
