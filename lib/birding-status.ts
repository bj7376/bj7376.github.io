const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifqrvugxfmeclaqadqbd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";

export async function getBirdingLastUpdated() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/birding_update_status?select=last_updated_at`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ last_updated_at: string | null }>;
  return rows[0]?.last_updated_at ?? null;
}
