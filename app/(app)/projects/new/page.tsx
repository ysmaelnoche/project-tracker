import Link from "next/link";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { Panel } from "@/components/ui/Panel";

// See PLAN.md "Creating a Project" and the Shipyard mockup's project create form.
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-[560px]">
      <Link
        href="/projects"
        className="font-mono text-[9px] tracking-[0.16em] text-ink-faint hover:text-ink"
      >
        ◂ FLEET
      </Link>

      <Panel className="mt-5 p-6 sm:p-8">
        <div className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">
          {"// NEW RECORD"}
        </div>
        <h1 className="mt-3 font-mono text-2xl font-light tracking-[0.01em] text-ink">
          Register a project.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Every project starts on standby. Initiate the build when you&apos;re ready — that&apos;s
          also when tasks unlock and the start date is recorded for you.
        </p>

        <div className="mt-7">
          <NewProjectForm error={error} />
        </div>
      </Panel>
    </div>
  );
}
