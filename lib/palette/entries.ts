/**
 * Builds the command palette's flat search index from the current
 * projects/open tasks plus a fixed list of commands. Pure mapping — no I/O
 * (see `lib/palette/queries.ts` for the tiny direct reads that feed this).
 * Mirrors the reference's `paletteFlat()` (design/Shipyard.reference.html).
 */
import type { PaletteEntry } from "@/lib/palette/types";
import type { ProjectStatus } from "@/lib/types";

// Just the columns the palette needs — deliberately not importing the full
// `Project`/`Task` types (or a shared "projects/tasks service") so this slice
// stays a tiny, self-contained read, per the task brief.
export interface PaletteProjectInput {
  id: string;
  ref: string;
  name: string;
  status: ProjectStatus;
}

export interface PaletteTaskInput {
  id: string;
  ref: string;
  title: string;
  projectId: string | null;
  status: "todo" | "in_progress" | "done";
}

// Kept as a small local copy rather than importing `stageLabel` from
// `components/ui/StageBadge` — lib/ shouldn't depend on components/, and
// this mirrors the same tradeoff already made in `lib/tasks/present.ts`.
const STAGE_LABEL: Record<ProjectStatus, string> = {
  pending: "STANDBY",
  in_development: "BUILD",
  production: "DEPLOYED",
  paused: "HOLD",
  archived: "DECOMM",
};

/** The fixed command list from PLAN.md "Search and Command Palette". */
export const PALETTE_COMMANDS: { label: string; meta: string; target: string }[] = [
  { label: "New project", meta: "CREATE", target: "/projects/new" },
  { label: "New standalone task", meta: "CREATE", target: "/tasks/new" },
  { label: "New project task", meta: "CREATE", target: "/tasks/new?context=project" },
  { label: "Overview", meta: "JUMP", target: "/dashboard" },
  { label: "Fleet", meta: "JUMP", target: "/projects" },
  { label: "Queue", meta: "JUMP", target: "/tasks" },
  { label: "Source", meta: "JUMP", target: "/source" },
  { label: "Log", meta: "JUMP", target: "/activity" },
  { label: "Config", meta: "JUMP", target: "/settings" },
  { label: "Link a repository", meta: "CONNECT", target: "/source" },
];

export function buildPaletteEntries({
  projects,
  tasks,
}: {
  projects: PaletteProjectInput[];
  tasks: PaletteTaskInput[];
}): PaletteEntry[] {
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const fleet: PaletteEntry[] = projects.map((p) => ({
    id: `project-${p.id}`,
    group: "FLEET",
    label: `${p.ref}  ${p.name}`,
    keywords: p.ref,
    meta: STAGE_LABEL[p.status],
    target: `/projects/${p.id}`,
  }));

  const queue: PaletteEntry[] = tasks
    .filter((t) => t.status !== "done")
    .map((t) => {
      const project = t.projectId ? (projectById.get(t.projectId) ?? null) : null;
      return {
        id: `task-${t.id}`,
        group: "QUEUE" as const,
        label: t.title,
        keywords: t.ref,
        meta: project ? project.ref : "STANDALONE",
        target: project ? `/projects/${project.id}` : "/tasks",
      };
    });

  const commands: PaletteEntry[] = PALETTE_COMMANDS.map((c, i) => ({
    id: `command-${i}`,
    group: "COMMANDS" as const,
    label: c.label,
    meta: c.meta,
    target: c.target,
  }));

  return [...fleet, ...queue, ...commands];
}
