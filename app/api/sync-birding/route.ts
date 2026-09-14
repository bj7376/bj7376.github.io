const FUNCTION_URL = "https://ifqrvugxfmeclaqadqbd.supabase.co/functions/v1/sync-macaulay";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
