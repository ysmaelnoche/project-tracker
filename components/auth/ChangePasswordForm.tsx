"use client";

import { useRef, useState, useTransition } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { passwordsMatch, validatePassword } from "@/lib/auth/validation";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setError(errors[0]!);
      return;
    }
    if (!passwordsMatch(newPassword, confirmPassword)) {
      setError("New passwords don't match.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.ok) {
        setSuccess(true);
        formRef.current?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 px-4 py-3.5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="currentPassword"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            CURRENT PASSWORD
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
          />
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            NEW PASSWORD
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            CONFIRM NEW PASSWORD
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
          />
        </div>
      </div>

      <p className="font-mono text-[9px] leading-relaxed tracking-[0.1em] text-ink-faint">
        AT LEAST 8 CHARACTERS · ONE UPPERCASE · ONE LOWERCASE · ONE NUMBER · ONE SYMBOL
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "SAVING…" : "CHANGE PASSWORD"}
        </button>
        {error ? <p className="font-mono text-xs tracking-[0.02em] text-red">{error}</p> : null}
        {success ? (
          <p className="font-mono text-xs tracking-[0.02em] text-teal">Password updated.</p>
        ) : null}
      </div>
    </form>
  );
}
