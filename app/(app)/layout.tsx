import { Suspense } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Header } from "@/components/nav/Header";
import { ScopeBar } from "@/components/nav/ScopeBar";
import { ToastProvider } from "@/components/ui/Toast";
import { listPaletteProjects, listPaletteTasks } from "@/lib/palette/queries";
import { computeStatusLineCounts, formatStatusLine } from "@/lib/dashboard/status-line";
import { getStatusLineCounts } from "@/lib/dashboard/queries";

// A failed read here must never take down every page in the app (PLAN.md
// "Error States") — the palette just has fewer results if this fails.
async function loadPaletteSource() {
  try {
    const [projects, tasks] = await Promise.all([listPaletteProjects(), listPaletteTasks()]);
    return { projects, tasks };
  } catch {
    return { projects: [], tasks: [] };
  }
}

async function StatusLine() {
  const today = new Date().toISOString().slice(0, 10);
  const { projects, tasks } = await getStatusLineCounts();
  return <ScopeBar statusLine={formatStatusLine(computeStatusLineCounts(projects, tasks, today))} />;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { projects, tasks } = await loadPaletteSource();

  return (
    <ToastProvider>
      <Header />
      {/* fallback stays `null` (not a <ScopeBar> with its own useSearchParams()) —
          the fallback itself isn't wrapped in a further Suspense boundary, so a
          client component using useSearchParams() there hits the same CSR-bailout
          error this Suspense boundary exists to avoid. */}
      <Suspense fallback={null}>
        <StatusLine />
      </Suspense>
      <main className="mx-auto max-w-[1320px] px-4 pb-32 pt-6 sm:px-8 sm:pt-8">
        {children}
      </main>
      <CommandPalette projects={projects} tasks={tasks} />
    </ToastProvider>
  );
}
