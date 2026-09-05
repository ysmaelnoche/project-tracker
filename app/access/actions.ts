"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Issues a magic-link sign-in email. Single-operator app: no password, no sign-up
 * flow — whoever holds the inbox for the configured email is the operator.
 */
export async function requestAccessLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!isValidEmail(email)) {
    redirect(`/access?error=invalid_email`);
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/access?error=send_failed`);
  }

  redirect(`/access?sent=${encodeURIComponent(email)}`);
}
