"use client";

import { useState, useTransition } from "react";
import { updateUsername } from "@/lib/auth/actions";
import { validateUsername } from "@/lib/auth/validation";
import { Spinner } from "@/components/ui/Spinner";

export function ChangeUsernameForm({ currentUsername }: { currentUsername: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    const raw = String(formData.get("username") ?? "");

    // Instant client-side feedback — the Server Action re-validates
    // authoritatively, this just avoids a round trip for an obvious mistake.
    const { valid, errors } = validateUsername(raw);
    if (!valid) {
      setError(errors[0]!);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateUsername(formData);
      if (result.ok) setSuccess(true);
      else setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3 px-4 py-3.5">
      <div className="min-w-[200px] flex-1">
        <label
          htmlFor="username"
          className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
        >
          USERNAME
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          defaultValue={currentUsername ?? ""}
          placeholder="operator"
          className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> SAVING…
          </span>
        ) : (
          "SAVE"
        )}
      </button>
      {error ? (
        <p className="basis-full font-mono text-xs tracking-[0.02em] text-red">{error}</p>
      ) : null}
      {success ? (
        <p className="basis-full font-mono text-xs tracking-[0.02em] text-teal">
          Username updated.
        </p>
      ) : null}
    </form>
  );
}
