import Link from "next/link";
import { FleetFilters } from "@/components/projects/FleetFilters";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { filterProjects } from "@/lib/projects/filters";
import { listProjects } from "@/lib/projects/queries";
import { listTasksForProjects } from "@/lib/projects/task-reads";
import type { ProjectStatus, ProjectType } from "@/lib/types";

type ClassValue = "all" | ProjectType;
type StageValue = "all" | ProjectStatus;

const STAGE_VALUES: ProjectStatus[] = [
  "pending",
  "in_development",
  "paused",
  "production",
  "archived",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function asClassValue(value: string | undefined): ClassValue {
  return value === "personal" || value === "work" ? value : "all";
}

function asStageValue(value: string | undefined): StageValue {
  return (STAGE_VALUES as string[]).includes(value ?? "") ? (value as StageValue) : "all";
}

// PLAN.md "Projects View": class (Personal/Work) + stage filters, layered with
// the shared `?scope=` from the layout's ScopeBar. See the Shipyard mockup's
// `data-screen-label="Fleet"` section for the reference layout.
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; stage?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const classFilter = asClassValue(params.class);
  const stageFilter = asStageValue(params.stage);
  const scope = asClassValue(params.scope);

  const projects = await listProjects();
  const taskMap = await listTasksForProjects(projects.map((p) => p.id));
  const today = new Date().toISOString().slice(0, 10);

  const classScoped = projects.filter(
    (p) =>
      (classFilter === "all" || p.type === classFilter) && (scope === "all" || p.type === scope),
  );
  const stageCounts: Record<StageValue, number> = {
    all: classScoped.filter((p) => p.status !== "archived").length,
    pending: classScoped.filter((p) => p.status === "pending").length,
    in_development: classScoped.filter((p) => p.status === "in_development").length,
    production: classScoped.filter((p) => p.status === "production").length,
    paused: classScoped.filter((p) => p.status === "paused").length,
    archived: classScoped.filter((p) => p.status === "archived").length,
  };

  const filtered = filterProjects(projects, { classFilter, stageFilter, scope });
  const archivedCount = projects.filter((p) => p.status === "archived").length;
  const activeCount = projects.length - archivedCount;
  const isFleetEmpty = projects.length === 0;

  const newProjectButton = (
    <Link
      href="/projects/new"
      className="cursor-pointer bg-accent px-[15px] py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-colors hover:bg-accent-hover"
    >
      + LAY KEEL
    </Link>
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="m-0 font-mono text-[clamp(24px,3.4vw,32px)] font-light tracking-[0.02em] text-ink">
          FLEET
        </h1>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink-faint">
          {pad2(activeCount)} ACTIVE · {pad2(archivedCount)} DECOMMISSIONED
        </span>
        <div className="ml-auto">{newProjectButton}</div>
      </div>

      <FleetFilters classFilter={classFilter} stageFilter={stageFilter} stageCounts={stageCounts} />

      {filtered.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={taskMap.get(project.id) ?? []}
              today={today}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState
            eyebrow="NO RECORDS"
            title={isFleetEmpty ? "The fleet is empty." : "No records match."}
            body={
              isFleetEmpty
                ? "Lay your first keel. Everything else in the console follows from it."
                : "Loosen a filter, or lay a new keel."
            }
            action={newProjectButton}
          />
        </div>
      )}
    </div>
  );
}
