"use client";

interface ConfirmDialogProps {
  open: boolean;
  tone?: "amber" | "teal" | "red";
  eyebrow: string;
  refLabel?: string;
  title: string;
  body: string;
  fromLabel?: string;
  toLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hideConfirm?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

const TONE_TEXT: Record<NonNullable<ConfirmDialogProps["tone"]>, string> = {
  amber: "text-amber",
  teal: "text-teal",
  red: "text-red",
};
const TONE_BORDER: Record<NonNullable<ConfirmDialogProps["tone"]>, string> = {
  amber: "border-amber",
  teal: "border-teal",
  red: "border-red",
};

/**
 * Confirmation modal for lifecycle transitions (start development, mark
 * production, decommission, purge). Controlled — the caller owns `open` state
 * and passes `onConfirm`/`onClose`. Matches the Shipyard mockup's modal.
 */
export function ConfirmDialog({
  open,
  tone = "amber",
  eyebrow,
  refLabel,
  title,
  body,
  fromLabel,
  toLabel,
  confirmLabel = "CONFIRM",
  cancelLabel = "CANCEL",
  hideConfirm = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center overflow-auto bg-black/76 p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-[472px] animate-[lift_0.18s_ease] border border-border-strong bg-surface-raised shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]"
      >
        <div
          className={`pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l ${TONE_BORDER[tone]}`}
        />
        <div
          className={`pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r ${TONE_BORDER[tone]}`}
        />

        <div className="flex flex-wrap items-baseline gap-3 border-b border-border px-5 py-3.5">
          <span className={`font-mono text-[9px] tracking-[0.18em] ${TONE_TEXT[tone]}`}>
            {`// ${eyebrow}`}
          </span>
          {refLabel ? (
            <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink-faint">
              {refLabel}
            </span>
          ) : null}
        </div>

        <div className="px-5 pb-6 pt-6">
          <h2 className="font-mono text-[22px] font-light leading-snug text-ink">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{body}</p>

          {fromLabel && toLabel ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 border border-border bg-track p-4">
              <div>
                <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                  CURRENT
                </div>
                <div className="mt-2 font-mono text-xs tracking-[0.13em] text-ink-3">
                  {fromLabel}
                </div>
              </div>
              <span className={`font-mono text-sm ${TONE_TEXT[tone]}`}>▸▸</span>
              <div>
                <div className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
                  TARGET
                </div>
                <div className={`mt-2 font-mono text-xs tracking-[0.13em] ${TONE_TEXT[tone]}`}>
                  {toLabel}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer border border-border-strong bg-transparent px-4 py-2.5 font-mono text-[10px] tracking-[0.13em] text-ink-2 hover:border-ink hover:text-ink"
            >
              {cancelLabel}
            </button>
            {!hideConfirm ? (
              <button
                onClick={onConfirm}
                className={`cursor-pointer border-0 px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg ${
                  tone === "red" ? "bg-red" : tone === "teal" ? "bg-teal" : "bg-amber"
                }`}
              >
                {confirmLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
