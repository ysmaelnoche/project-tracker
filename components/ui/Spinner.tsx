function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * A small rotating ring for inline "working" states (buttons mid-Server-Action,
 * a sync in progress). Deliberately a plain ring, not an icon-font glyph — it's
 * the one loading primitive every pending button in the app should share.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Working"
      className={cx(
        "inline-block h-3 w-3 flex-none animate-spin rounded-full border-2 border-accent/25 border-t-accent align-[-2px]",
        className,
      )}
    />
  );
}
