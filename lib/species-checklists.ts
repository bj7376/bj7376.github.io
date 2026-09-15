import type { RelatedChecklist } from "@/lib/birding";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifqrvugxfmeclaqadqbd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";

type DbSpeciesChecklist = {
  checklist_id: string;
  observed_date: string | null;
  location_name: string | null;
  has_photo: boolean;
};

export type SpeciesChecklist = RelatedChecklist & {
  hasPhoto: boolean;
};

export async function getSpeciesChecklists(
  speciesCode: string,
  fallback: RelatedChecklist[],
): Promise<SpeciesChecklist[]> {
  const byId = new Map<string, SpeciesChecklist>(
    fallback.map((checklist) => [checklist.id, { ...checklist, hasPhoto: true }]),
  );

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/public_species_checklists?select=checklist_id,observed_date,location_name,has_photo&species_code=eq.${encodeURIComponent(speciesCode)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    },
  );

  if (response.ok) {
    const rows = (await response.json()) as DbSpeciesChecklist[];
    for (const row of rows) {
      byId.set(row.checklist_id, {
        id: row.checklist_id,
        date: row.observed_date || "",
        place: row.location_name || "",
        url: `https://ebird.org/checklist/${row.checklist_id}`,
        hasPhoto: row.has_photo,
      });
    }
  }

  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}
