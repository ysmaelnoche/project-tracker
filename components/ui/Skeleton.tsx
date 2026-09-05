function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** A single skeleton bar with a scanline sweeping across it — the "system is
 * reading data" feel, instead of a plain opacity pulse. */
function ScanBar({ className }: { className?: string }) {
  return (
    <div className={cx("relative overflow-hidden bg-divider", className)}>
      <div className="absolute inset-y-0 left-0 w-1/3 animate-[scan_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border bg-surface p-5">
          <ScanBar className="h-[11px] w-[210px]" />
          <ScanBar className="mt-3.5 h-2 w-[58%]" />
        </div>
      ))}
    </div>
  );
}
