import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { ScopeBar } from "@/components/nav/ScopeBar";
import { ToastProvider } from "@/components/ui/Toast";
import { computeStatusLineCounts, formatStatusLine } from "@/lib/dashboard/status-line";
import { getStatusLineCounts } from "@/lib/dashboard/queries";

async function StatusLine() {
  const today = new Date().toISOString().slice(0, 10);
  const { projects, tasks } = await getStatusLineCounts();
  return <ScopeBar statusLine={formatStatusLine(computeStatusLineCounts(projects, tasks, today))} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    </ToastProvider>
  );
}
