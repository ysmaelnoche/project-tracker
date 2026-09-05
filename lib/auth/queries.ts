import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves a username to its account's email, using the service-role client
 * so this works *before* the caller is authenticated (that's the whole point
 * — it's the first step of signing in). Never exposed to the browser: this
 * only ever runs inside a Server Action.
 */
export async function resolveEmailForUsername(username: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;

  const { data, error } = await admin.auth.admin.getUserById(profile.user_id);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

export interface LastSessionInfo {
  /** ISO instant, or null if this account has never signed in before. */
  lastSignInAt: string | null;
}

/**
 * The operator's previous sign-in time — a classic Unix "last login" banner,
 * shown right on the Access screen so a returning operator can notice
 * anything unexpected before they even sign in. This is Supabase Auth's own
 * `last_sign_in_at`, not a bespoke session log; single-operator app, so
 * there's exactly one profile to look up, and it's safe to read before
 * anyone is authenticated (service-role only, never exposed to the browser).
 */
export async function getLastSessionInfo(): Promise<LastSessionInfo> {
  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("user_id").limit(1).maybeSingle();
  if (!profile) return { lastSignInAt: null };

  const { data, error } = await admin.auth.admin.getUserById(profile.user_id);
  if (error || !data?.user) return { lastSignInAt: null };
  return { lastSignInAt: data.user.last_sign_in_at ?? null };
}

/** The signed-in operator's username, for the Settings screen. */
export async function getCurrentUsername(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.username ?? null;
}
