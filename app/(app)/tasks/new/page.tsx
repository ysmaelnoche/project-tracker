import { NewTaskForm } from "@/components/tasks/NewTaskForm";
import { buildProjectOptions } from "@/lib/tasks/present";
import { listProjectsLite } from "@/lib/tasks/queries";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; context?: string }>;
}) {
  const { project, context } = await searchParams;
  const projects = await listProjectsLite();
  const options = buildProjectOptions(projects);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-mono text-2xl font-light tracking-[0.02em] sm:text-[32px]">NEW TASK</h1>
      <NewTaskForm
        options={options}
        defaultProjectId={project ?? null}
        hideStandaloneOption={context === "project"}
      />
    </div>
  );
}
