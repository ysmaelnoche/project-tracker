import { Panel } from "@/components/ui/Panel";

// TODO(projects slice): replace with the real Project detail workspace — lifecycle
// actions, progress, tasks, source panel, links, notes, activity. See PLAN.md
// "Project Detail Experience" and the Shipyard mockup's `isProject` section.
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Panel className="p-8 text-ink-3">
      Project {id} — under construction.
    </Panel>
  );
}
