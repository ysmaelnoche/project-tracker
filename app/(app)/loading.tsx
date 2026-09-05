import { SkeletonRows } from "@/components/ui/Skeleton";

/**
 * Shown by Next.js while a route segment's Server Components are fetching —
 * i.e. the moment between clicking a nav link and the next screen having
 * data. Most of the time that's near-instant and this never gets a chance to
 * render; when it does (a slow connection, a cold serverless start), it
 * should still look like part of the console, not a generic spinner.
 */
export default function Loading() {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 animate-[blink_1.1s_ease-in-out_infinite] rounded-full bg-accent shadow-[0_0_9px_rgba(58,192,240,0.8)]" />
        <span className="font-mono text-[9px] tracking-[0.2em] text-accent">
          {"// ESTABLISHING LINK"}
        </span>
      </div>

      <div className="relative mt-4 h-[3px] overflow-hidden border border-border-strong bg-track">
        <div className="absolute inset-y-0 left-0 w-1/4 animate-[scan-wide_1.1s_ease-in-out_infinite] bg-accent shadow-[0_0_10px_rgba(58,192,240,0.6)]" />
      </div>

      <div className="mt-8">
        <SkeletonRows count={4} />
      </div>
    </div>
  );
}
