import { Suspense } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Header } from "@/components/nav/Header";
import { ScopeBar } from "@/components/nav/ScopeBar";
import { ToastProvider } from "@/components/ui/Toast";
import { listPaletteProjects, listPaletteTasks } from "@/lib/palette/queries";

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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { projects, tasks } = await loadPaletteSource();

  return (
    <ToastProvider>
      <Header />
      {/* TODO(dashboard slice): pass a real "FLEET n · BUILD n · QUEUE n · ALERTS n" line. */}
      <Suspense fallback={null}>
        <ScopeBar statusLine="" />
      </Suspense>
      <main className="mx-auto max-w-[1320px] px-4 pb-32 pt-6 sm:px-8 sm:pt-8">
        {children}
      </main>
      <CommandPalette projects={projects} tasks={tasks} />
    </ToastProvider>
  );
}
