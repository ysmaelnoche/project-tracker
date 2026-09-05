import { Panel } from "@/components/ui/Panel";

// TODO(tasks slice): replace with the real "New task" form (title, project or
// standalone, priority, due date). Must refuse a project whose status is
// "pending" — see PLAN.md "Project Task Business Rule".
export default function NewTaskPage() {
  return (
    <Panel className="p-8 text-ink-3">
      New task — under construction.
    </Panel>
  );
}
