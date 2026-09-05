function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * A small counter-rotating twin-ring reticle for inline "working" states
 * (buttons mid-Server-Action, a sync in progress). Deliberately a plain
 * glyph, not an icon font — it's the one lightweight loading primitive every
 * pending button in the app shares. For a heavier, narrated wait (creating a
 * record, linking a repository), see `components/ui/BufferPanel.tsx` instead
 * — this is the "something is happening" tier, that's the "here's what" tier.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Working" className={cx("relative inline-block h-3 w-3 flex-none align-[-2px]", className)}>
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
      <span className="absolute inset-[3px] rounded-full border border-accent/50 [animation:spin_1.1s_linear_infinite_reverse]" />
    </span>
  );
}
