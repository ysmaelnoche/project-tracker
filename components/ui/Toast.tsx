"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Tone = "amber" | "teal" | "red" | "quiet";

interface ToastInput {
  label: string;
  message: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastItem extends ToastInput {
  id: string;
}

const TONE_BORDER: Record<Tone, string> = {
  amber: "border-l-amber",
  teal: "border-l-teal",
  red: "border-l-red",
  quiet: "border-l-ink-faint",
};

const TONE_TEXT: Record<Tone, string> = {
  amber: "text-amber",
  teal: "text-teal",
  red: "text-red",
  quiet: "text-ink-3",
};

const ToastContext = createContext<{ show: (input: ToastInput) => void } | null>(null);

/**
 * Global toast stack. Mount once near the root (see app/(app)/layout.tsx); any
 * component can then call `useToast().show(...)` — used for task/project lifecycle
 * feedback, GitHub sync results, etc. Auto-dismisses after 5s, caps at 3 visible.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = `toast-${++seq.current}`;
      setToasts((current) => [{ ...input, id }, ...current].slice(0, 3));
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => {
          const tone = t.tone ?? "amber";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto animate-[lift_0.16s_ease] border border-l-2 border-border-strong bg-surface-raised p-3.5 shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)] ${TONE_BORDER[tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`font-mono text-[9px] tracking-[0.14em] ${TONE_TEXT[tone]}`}>
                  {t.label}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px] text-ink-disabled hover:text-ink-2"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{t.message}</p>
              {t.actionLabel && t.onAction ? (
                <button
                  onClick={() => {
                    dismiss(t.id);
                    t.onAction?.();
                  }}
                  className="mt-2 cursor-pointer border-0 bg-transparent p-0 font-mono text-[9px] tracking-[0.12em] text-amber hover:text-amber-hover"
                >
                  {t.actionLabel}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
