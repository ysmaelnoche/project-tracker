import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-border bg-surface px-6 py-11 text-center">
      <div className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">
        {`// ${eyebrow}`}
      </div>
      <div className="mt-4 font-mono text-xl font-light text-ink">{title}</div>
      {body ? (
        <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-3">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
