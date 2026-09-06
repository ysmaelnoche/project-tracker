import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { Clock } from "./Clock";
import { QuickCreate } from "./QuickCreate";
import { PaletteTrigger } from "./PaletteTrigger";

/**
 * Below `lg:` (1024px — see MobileNav's docstring for why that breakpoint),
 * the six-link NavLinks plus Clock/⌘K collapse into MobileNav's toggle; only
 * the logo and QuickCreate ("+ NEW", a primary action worth keeping one tap
 * away) stay in the header itself.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[50px] max-w-[1320px] flex-wrap items-center gap-4 px-4 sm:gap-8 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 py-2">
          <span className="h-[7px] w-[7px] animate-[blink_3.4s_ease-in-out_infinite] rounded-full bg-accent shadow-[0_0_9px_rgba(58,192,240,0.8)]" />
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-ink">
            SHIPYARD
          </span>
          <span className="hidden font-mono text-[9px] tracking-[0.16em] text-ink-faint sm:inline">
            {"// BUILD CONTROL"}
          </span>
        </Link>

        <div className="hidden lg:block">
          <NavLinks />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="hidden lg:block">
            <Clock />
          </div>
          <div className="hidden lg:block">
            <PaletteTrigger />
          </div>
          <QuickCreate />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
