import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { Clock } from "./Clock";
import { QuickCreate } from "./QuickCreate";
import { PaletteTrigger } from "./PaletteTrigger";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[50px] max-w-[1320px] flex-wrap items-center gap-4 px-4 sm:gap-8 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 py-2">
          <span className="h-[7px] w-[7px] animate-[blink_3.4s_ease-in-out_infinite] rounded-full bg-amber shadow-[0_0_9px_rgba(233,169,74,0.8)]" />
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-ink">
            YSMAEL&apos;S SHIPYARD
          </span>
          <span className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            {"// BUILD CONTROL"}
          </span>
        </Link>

        <NavLinks />

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Clock />
          <PaletteTrigger />
          <QuickCreate />
        </div>
      </div>
    </header>
  );
}
