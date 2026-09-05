import { requestAccessLink } from "./actions";

const ERROR_COPY: Record<string, string> = {
  invalid_email: "That doesn't look like a valid address.",
  send_failed: "Could not send the access link. Try again in a moment.",
  auth: "That link was invalid or has expired. Request a new one.",
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const errorMessage = error ? ERROR_COPY[error] ?? ERROR_COPY.send_failed : null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-bg p-6">
      <div className="relative w-full max-w-[392px] border border-border-strong bg-surface-raised p-8">
        <div className="pointer-events-none absolute -top-px -left-px h-[11px] w-[11px] border-t border-l border-amber" />
        <div className="pointer-events-none absolute -bottom-px -right-px h-[11px] w-[11px] border-b border-r border-amber" />

        <div className="flex items-center gap-2">
          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-amber shadow-[0_0_9px_rgba(233,169,74,0.8)]" />
          <span className="font-mono text-xs font-medium tracking-[0.16em]">SHIPYARD</span>
        </div>

        <div className="mt-8 font-mono text-[9px] tracking-[0.2em] text-ink-faint">
          {"// IDENTITY VERIFICATION"}
        </div>
        <h1 className="mt-4 font-mono text-[26px] font-light leading-tight tracking-[0.01em]">
          Request access.
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
          Single operator, single log. A one-time link is issued to your address — no
          credentials stored.
        </p>

        {sent ? (
          <div className="mt-7 border border-border bg-track p-4">
            <div className="font-mono text-[9px] tracking-[0.16em] text-teal">
              {"// LINK ISSUED"}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Sent to <span className="text-ink">{sent}</span>. Open it on this device to
              sign in.
            </p>
          </div>
        ) : (
          <form action={requestAccessLink} className="mt-7">
            <label
              htmlFor="email"
              className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
            >
              ADDRESS
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="operator@somewhere.dev"
              className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
            />
            {errorMessage ? (
              <p className="mt-2 font-mono text-xs tracking-[0.04em] text-red">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-4 w-full cursor-pointer bg-amber px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-amber-hover"
            >
              ▸ ISSUE ACCESS LINK
            </button>
          </form>
        )}

        <div className="mt-5 font-mono text-[9px] leading-loose tracking-[0.12em] text-ink-disabled">
          ROW-LEVEL SECURITY ACTIVE
          <br />
          OWNERSHIP ENFORCED AT DATABASE LAYER
        </div>
      </div>
    </div>
  );
}
