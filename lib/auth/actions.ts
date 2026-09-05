"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { resolveEmailForUsername } from "@/lib/auth/queries";
import { normalizeUsername, validatePassword, validateUsername } from "@/lib/auth/validation";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

/**
 * Sign in with username + password. Resolves the username to its account's
 * email server-side, then defers entirely to Supabase's own password check —
 * we never store or compare a password ourselves. Deliberately returns the
 * same generic error whether the username is unknown or the password is
 * wrong, so a failed attempt can't be used to enumerate valid usernames.
 */
export async function signInWithUsername(formData: FormData) {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    redirect("/access?error=missing_fields");
  }

  const email = await resolveEmailForUsername(username);
  if (!email) {
    redirect("/access?error=invalid_credentials");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/access?error=invalid_credentials");
  }

  redirect("/dashboard");
}

/** Changes the signed-in operator's username. Server-side is authoritative — the
 * client form pre-validates for instant feedback, but this re-validates and
 * relies on the database's own uniqueness constraint to catch a race. */
export async function updateUsername(formData: FormData): Promise<ProfileActionResult> {
  const raw = String(formData.get("username") ?? "");
  const { valid, errors } = validateUsername(raw);
  if (!valid) return { ok: false, error: errors[0]! };

  const username = normalizeUsername(raw);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("user_id", user.id);

  if (error) {
    // Postgres unique_violation — the profiles.username unique constraint caught it.
    if (error.code === "23505") {
      return { ok: false, error: "That username is already taken." };
    }
    return { ok: false, error: "Could not update username. Try again." };
  }

  revalidatePath("/settings");
  return { ok: true };
}

/** Changes the signed-in operator's password, re-verifying the current one first
 * (Supabase's updateUser() doesn't itself require it — this is our own guard). */
export async function updatePassword(formData: FormData): Promise<ProfileActionResult> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const { valid, errors } = validatePassword(newPassword);
  if (!valid) return { ok: false, error: errors[0]! };
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { ok: false, error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: "Could not update password. Try again." };

  return { ok: true };
}
