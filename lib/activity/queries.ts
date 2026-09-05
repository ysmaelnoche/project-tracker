import "server-only";

/**
 * Read-only access to the app-wide activity_log for the Activity/Event Log
 * screen. Deliberately separate from `lib/projects/queries.ts`'s
 * `listActivityForProject` (same row shape, different scope) rather than a
 * shared "activity service" — see task brief.
 */

import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent, ActivityTone } from "@/lib/types";

interface ActivityRow {
  id: string;
  verb: string;
  subject: string;
  context_ref: string | null;
  tone: ActivityTone;
  created_at: string;
}

/** The most recent `limit` activity events across the whole account, newest first. */
export async function listRecentActivity(limit = 100): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as ActivityRow[]).map((row) => ({
    id: row.id,
    verb: row.verb,
    subject: row.subject,
    contextRef: row.context_ref,
    tone: row.tone,
    createdAt: row.created_at,
  }));
}
