"use client";

import { useState, useTransition } from "react";
import { removeGithubToken, saveGithubToken } from "@/lib/github/actions";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Paste-a-token form for the Config screen — the in-app alternative to
 * setting GITHUB_TOKEN as a server env var. Never shows the token itself
 * back (write-only, like a password field): once saved, all this can do is
 * replace it or remove it.
 */
export function GithubTokenForm({ hasDatabaseToken }: { hasDatabaseToken: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setSuccess(null);
    if (!String(formData.get("token") ?? "").trim()) {
      setError("Enter a token.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await saveGithubToken(formData);
      if (result.ok) {
        setSuccess("Token saved and verified with GitHub.");
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeGithubToken();
      if (result.ok) setSuccess("Token removed.");
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-divider px-4 py-3.5">
      <form action={handleSave} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="token" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
            {hasDatabaseToken ? "REPLACE TOKEN" : "PERSONAL ACCESS TOKEN"}
          </label>
          <input
            id="token"
            name="token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="github_pat_…"
            className="mt-2 w-full border border-border-strong bg-track px-3 py-2 font-mono text-xs tracking-[0.02em] text-ink outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> VERIFYING…
            </span>
          ) : (
            "SAVE"
          )}
        </button>
        {hasDatabaseToken ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="cursor-pointer border border-border-strong bg-transparent px-3.5 py-2 font-mono text-[9px] tracking-[0.13em] text-ink-2 transition-colors hover:border-red hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
          >
            REMOVE
          </button>
        ) : null}
      </form>

      <p className="font-mono text-[9px] leading-relaxed tracking-[0.1em] text-ink-faint">
        A FINE-GRAINED TOKEN, READ-ONLY: CONTENTS · METADATA · PULL REQUESTS · CHECKS
      </p>

      {error ? <p className="font-mono text-xs tracking-[0.02em] text-red">{error}</p> : null}
      {success ? <p className="font-mono text-xs tracking-[0.02em] text-teal">{success}</p> : null}
    </div>
  );
}
