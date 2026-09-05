import type { ButtonHTMLAttributes } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-amber text-bg hover:bg-amber-hover",
  secondary:
    "bg-transparent border border-border-strong text-ink-2 hover:border-amber hover:text-amber",
  ghost: "bg-transparent border-0 text-ink-3 hover:text-amber",
  danger:
    "bg-transparent border border-border-strong text-ink-2 hover:border-red hover:text-red",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "cursor-pointer px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
