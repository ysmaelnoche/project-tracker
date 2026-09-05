import Link from "next/link";

// Root not-found — covers unknown routes and `notFound()` calls anywhere in
// the app (e.g. `/projects/[id]` for an id that doesn't exist). Matches the
// Shipyard visual language instead of Next's default page.
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="relative w-full max-w-[440px] border border-border-strong bg-surface-raised p-8 text-center">
        <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-amber" />
        <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-amber" />

        <div className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">{"// 404"}</div>
        <h1 className="mt-4 font-mono text-[26px] font-light leading-tight tracking-[0.01em] text-ink">
          Nothing on record.
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
          That project, task, or route doesn&apos;t exist — or it was decommissioned.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-block cursor-pointer bg-amber px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-amber-hover"
        >
          ◂ BACK TO OVERVIEW
        </Link>
      </div>
    </div>
  );
}
