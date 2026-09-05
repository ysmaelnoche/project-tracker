import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { ScopeBar } from "@/components/nav/ScopeBar";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    </ToastProvider>
  );
}
