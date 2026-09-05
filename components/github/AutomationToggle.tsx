"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { toggleAutomationSetting } from "@/lib/github/actions";
import type { AutomationSettingKey } from "@/lib/github/actions";

/** One automation-rule row on the Config screen — a labeled on/off switch. */
export function AutomationToggle({
  settingKey,
  label,
  detail,
  enabled,
}: {
  settingKey: AutomationSettingKey;
  label: string;
  detail: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleAutomationSetting(settingKey);
      if (!result.ok) {
        toast.show({ label: "SETTING NOT SAVED", tone: "red", message: result.error });
        return;
      }
      toast.show({
        label: enabled ? "RULE DISABLED" : "RULE ENABLED",
        tone: enabled ? "quiet" : "teal",
        message: `${label} is now ${enabled ? "inactive" : "active"}.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-3.5 border-b border-divider px-4 py-3.5 last:border-b-0">
      <button
        onClick={handleToggle}
        disabled={isPending}
        aria-label={`Toggle ${label}`}
        aria-pressed={enabled}
        className="relative mt-0.5 h-[15px] w-7 flex-none cursor-pointer border border-border-strong bg-track p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className={`absolute top-px h-[11px] w-[11px] transition-[left] duration-150 ease-out ${
            enabled ? "left-[14px] bg-teal" : "left-px bg-border-strong"
          }`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.13em] text-ink">{label}</span>
          <span
            className={`font-mono text-[9px] tracking-[0.14em] ${enabled ? "text-teal" : "text-ink-faint"}`}
          >
            {enabled ? "ON" : "OFF"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-3">{detail}</p>
      </div>
    </div>
  );
}
