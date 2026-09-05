function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Thin bordered gauge used for project progress bars, matching the Shipyard mockup. */
export function ProgressGauge({
  percent,
  tone = "accent",
  className,
}: {
  percent: number;
  tone?: "accent" | "teal" | "faint";
  className?: string;
}) {
  const fill = tone === "teal" ? "bg-teal" : tone === "faint" ? "bg-ink-faint" : "bg-accent";
  const glow =
    tone === "teal"
      ? "shadow-[0_0_10px_rgba(111,179,168,0.4)]"
      : tone === "accent"
        ? "shadow-[0_0_10px_rgba(58,192,240,0.35)]"
        : "";

  return (
    <div className={cx("relative h-[9px] border border-border-strong bg-track p-px", className)}>
      <div
        className={cx("h-full transition-[width] duration-500 ease-out", fill, glow)}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
