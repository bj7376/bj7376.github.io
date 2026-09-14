export type BirdPhoto = {
  id: string;
  label: string;
  year: number;
  takenAt: string;
  location: string;
  rating?: number;
  ratingCount?: number;
  src?: string;
  sourceUrl: string;
  checklistId?: string;
  mediaType?: string;
};

export type RelatedChecklist = {
  id: string;
  date: string;
  place: string;
  url: string;
};

export type Species = {
  code: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
  order: string;
  family: string;
  familyCommon: string;
  taxonomicOrder: number;
  photos: BirdPhoto[];
  relatedChecklists: RelatedChecklist[];
};

export type RankedPhoto = { bird: Species; photo: BirdPhoto };

type DbTaxon = {
  species_code: string;
  common_name: string;
  scientific_name: string;
  korean_name: string | null;
  taxonomic_order: number | null;
  order_name: string | null;
  family_common_name: string | null;
  family_scientific_name: string | null;
  submitted_name: string | null;
};

type DbMedia = {
  ml_asset_id: number;
  species_code: string;
  checklist_id: string | null;
  media_type: string | null;
  taken_at: string | null;
  location_id: string | null;
  location_name: string | null;
  rating: number | string | null;
  rating_count: number | null;
  source_url: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
};

type DbChecklist = {
  checklist_id: string;
  observed_date: string | null;
  observed_at: string | null;
  location_id: string | null;
};

type DbLocation = {
  location_id: string;
  name: string;
};

type TaxonomyRow = Record<string, string>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifqrvugxfmeclaqadqbd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";
const TAXONOMY_URL = "https://www.birds.cornell.edu/clementschecklist/wp-content/uploads/2026/04/eBird_taxonomy_v2025-4.csv";
const PAGE_SIZE = 1000;

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseCsv(text: string): TaxonomyRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    const result: TaxonomyRow = {};
    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });
    return result;
  });
}

async function fetchTable<T>(table: string, select = "*"): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Supabase ${table} request failed: ${response.status}`);
    const rows = (await response.json()) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

async function loadTaxonomy(): Promise<Map<string, TaxonomyRow>> {
  try {
    const response = await fetch(TAXONOMY_URL, { next: { revalidate: 86400 } });
    if (!response.ok) return new Map();
    const rows = parseCsv(await response.text());
    return new Map(
      rows
        .map((row) => [row.sci_name?.trim().toLowerCase(), row] as const)
        .filter(([name]) => Boolean(name)),
    );
  } catch {
    return new Map();
  }
}

function numeric(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function photoSort(a: BirdPhoto, b: BirdPhoto) {
  const rating = (b.rating ?? -1) - (a.rating ?? -1);
  if (rating) return rating;
  const ratingCount = (b.ratingCount ?? -1) - (a.ratingCount ?? -1);
  if (ratingCount) return ratingCount;
  return b.takenAt.localeCompare(a.takenAt) || Number(b.id) - Number(a.id);
}

export async function getBirdingSpecies(): Promise<Species[]> {
  const [taxa, media, checklists, locations, taxonomy] = await Promise.all([
    fetchTable<DbTaxon>("taxa"),
    fetchTable<DbMedia>("media"),
    fetchTable<DbChecklist>("checklists"),
    fetchTable<DbLocation>("locations"),
    loadTaxonomy(),
  ]);

  const locationsById = new Map(locations.map((location) => [location.location_id, location]));
  const checklistsById = new Map(checklists.map((checklist) => [checklist.checklist_id, checklist]));
  const mediaBySpecies = new Map<string, DbMedia[]>();

  for (const item of media) {
    if (!item.is_public) continue;
    const list = mediaBySpecies.get(item.species_code) ?? [];
    list.push(item);
    mediaBySpecies.set(item.species_code, list);
  }

  const birds = taxa.map<Species>((taxon) => {
    const taxonomyRow = taxonomy.get(taxon.scientific_name.trim().toLowerCase());
    const englishName = taxonomyRow?.primary_com_name?.trim() || taxon.common_name;
    const koreanName = taxon.korean_name?.trim()
      || (taxon.common_name !== englishName ? taxon.common_name : "")
      || englishName;
    const taxonOrder = numeric(taxonomyRow?.taxon_order) ?? taxon.taxonomic_order ?? Number.MAX_SAFE_INTEGER;
    const order = taxonomyRow?.order?.trim() || taxon.order_name?.trim() || "Unclassified";
    const family = taxonomyRow?.family_sci_name?.trim() || taxon.family_scientific_name?.trim() || "Unclassified";
    const familyCommon = taxonomyRow?.family_com_name?.trim() || taxon.family_common_name?.trim() || family;

    const birdMedia = mediaBySpecies.get(taxon.species_code) ?? [];
    const photos = birdMedia.map<BirdPhoto>((item) => {
      const location = item.location_name
        || (item.location_id ? locationsById.get(item.location_id)?.name : undefined)
        || "";
      const takenAt = dateOnly(item.taken_at);
      return {
        id: String(item.ml_asset_id),
        label: englishName,
        year: takenAt ? Number(takenAt.slice(0, 4)) : 0,
        takenAt,
        location,
        rating: numeric(item.rating),
        ratingCount: item.rating_count ?? undefined,
        src: item.thumbnail_url || `https://cdn.download.ams.birds.cornell.edu/api/v2/asset/${item.ml_asset_id}/1200`,
        sourceUrl: item.source_url || `https://macaulaylibrary.org/asset/${item.ml_asset_id}`,
        checklistId: item.checklist_id ?? undefined,
        mediaType: item.media_type ?? undefined,
      };
    }).sort(photoSort);

    const checklistIds = [...new Set(birdMedia.map((item) => item.checklist_id).filter((id): id is string => Boolean(id)))];
    const relatedChecklists = checklistIds.map<RelatedChecklist>((id) => {
      const checklist = checklistsById.get(id);
      const place = checklist?.location_id ? locationsById.get(checklist.location_id)?.name ?? "" : "";
      return {
        id,
        date: checklist?.observed_date || dateOnly(checklist?.observed_at) || "",
        place,
        url: `https://ebird.org/checklist/${id}`,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return {
      code: taxon.species_code,
      commonName: englishName,
      koreanName,
      scientificName: taxon.scientific_name,
      order,
      family,
      familyCommon,
      taxonomicOrder: taxonOrder,
      photos,
      relatedChecklists,
    };
  });

  return birds.sort((a, b) => a.taxonomicOrder - b.taxonomicOrder || a.commonName.localeCompare(b.commonName));
}

export function getSpecies(birds: Species[], code: string) {
  return birds.find((bird) => bird.code === code);
}

export function groupedSpecies(birds: Species[]) {
  return birds.reduce<Record<string, Record<string, Species[]>>>((acc, bird) => {
    acc[bird.order] ??= {};
    acc[bird.order][bird.familyCommon] ??= [];
    acc[bird.order][bird.familyCommon].push(bird);
    return acc;
  }, {});
}

export function getHeroPhoto(bird: Species) {
  return [...bird.photos].sort(photoSort)[0];
}

export function getRatedSpeciesRepresentatives(birds: Species[]): RankedPhoto[] {
  return birds
    .map((bird) => ({ bird, photo: getHeroPhoto(bird) }))
    .filter((item): item is RankedPhoto => Boolean(item.photo))
    .sort((a, b) => photoSort(a.photo, b.photo));
}

export function getRecentPhotos(birds: Species[]): RankedPhoto[] {
  const newestFirst = birds
    .flatMap((bird) => bird.photos.map((photo) => ({ bird, photo })))
    .sort((a, b) => b.photo.takenAt.localeCompare(a.photo.takenAt) || Number(b.photo.id) - Number(a.photo.id));

  const seen = new Set<string>();
  return newestFirst.filter(({ bird }) => {
    if (seen.has(bird.code)) return false;
    seen.add(bird.code);
    return true;
  });
}
