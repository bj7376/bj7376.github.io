export type BirdMedia = {
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

export type BirdPhoto = BirdMedia;

export type RelatedChecklist = {
  id: string;
  date: string;
  place: string;
  url: string;
};

export type Species = {
  code: string;
  slug: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
  order: string;
  family: string;
  familyCommon: string;
  taxonomicOrder: number;
  photos: BirdPhoto[];
  videos: BirdMedia[];
  audio: BirdMedia[];
  relatedChecklists: RelatedChecklist[];
};

export type RankedPhoto = { bird: Species; photo: BirdPhoto };

type DbTaxon = {
  species_code: string;
  ebird_species_code: string | null;
  common_name: string;
  scientific_name: string;
  korean_name: string | null;
  taxonomic_order: number | null;
  order_name: string | null;
  family_common_name: string | null;
  family_scientific_name: string | null;
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifqrvugxfmeclaqadqbd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";
const PAGE_SIZE = 1000;

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

function numeric(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function newestMediaSort(a: BirdMedia, b: BirdMedia) {
  return b.takenAt.localeCompare(a.takenAt) || Number(b.id) - Number(a.id);
}

function mediaKind(mediaType: string | null | undefined): "photo" | "video" | "audio" {
  const normalized = (mediaType || "").trim().toLowerCase();
  if (["video", "영상"].includes(normalized)) return "video";
  if (["audio", "sound", "음원"].includes(normalized)) return "audio";
  return "photo";
}

export async function getBirdingSpecies(): Promise<Species[]> {
  const [taxa, media, checklists, locations] = await Promise.all([
    fetchTable<DbTaxon>("taxa"),
    fetchTable<DbMedia>("media"),
    fetchTable<DbChecklist>("checklists"),
    fetchTable<DbLocation>("locations"),
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
    const englishName = taxon.common_name.trim();
    const koreanName = taxon.korean_name?.trim() || englishName;
    const taxonOrder = taxon.taxonomic_order ?? Number.MAX_SAFE_INTEGER;
    const order = taxon.order_name?.trim() || "Unclassified";
    const family = taxon.family_scientific_name?.trim() || "Unclassified";
    const familyCommon = taxon.family_common_name?.trim() || family;

    const birdMedia = mediaBySpecies.get(taxon.species_code) ?? [];
    const allMedia = birdMedia.map<BirdMedia>((item) => {
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
        src: item.thumbnail_url || (mediaKind(item.media_type) === "photo"
          ? `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${item.ml_asset_id}/1200`
          : undefined),
        sourceUrl: item.source_url || `https://macaulaylibrary.org/asset/${item.ml_asset_id}`,
        checklistId: item.checklist_id ?? undefined,
        mediaType: mediaKind(item.media_type),
      };
    });

    const photos = allMedia.filter((item) => item.mediaType === "photo").sort(newestMediaSort);
    const videos = allMedia.filter((item) => item.mediaType === "video").sort(newestMediaSort);
    const audio = allMedia.filter((item) => item.mediaType === "audio").sort(newestMediaSort);

    const checklistIds = [...new Set(birdMedia.map((item) => item.checklist_id).filter((id): id is string => Boolean(id)))];
    const relatedChecklists = checklistIds.map<RelatedChecklist>((id) => {
      const checklist = checklistsById.get(id);
      const mediaMatch = birdMedia.find((item) => item.checklist_id === id);
      const place = (checklist?.location_id ? locationsById.get(checklist.location_id)?.name : undefined)
        || mediaMatch?.location_name
        || "";
      return {
        id,
        date: checklist?.observed_date || dateOnly(checklist?.observed_at) || dateOnly(mediaMatch?.taken_at) || "",
        place,
        url: `https://ebird.org/checklist/${id}`,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return {
      code: taxon.species_code,
      slug: taxon.ebird_species_code?.trim() || taxon.species_code,
      commonName: englishName,
      koreanName,
      scientificName: taxon.scientific_name,
      order,
      family,
      familyCommon,
      taxonomicOrder: taxonOrder,
      photos,
      videos,
      audio,
      relatedChecklists,
    };
  });

  return birds.sort((a, b) => a.taxonomicOrder - b.taxonomicOrder || a.commonName.localeCompare(b.commonName));
}

export function getSpecies(birds: Species[], code: string) {
  return birds.find((bird) => bird.slug === code || bird.code === code);
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
  return bird.photos[0];
}

export function getLatestSpeciesRepresentatives(birds: Species[]): RankedPhoto[] {
  return birds
    .map((bird) => ({ bird, photo: getHeroPhoto(bird) }))
    .filter((item): item is RankedPhoto => Boolean(item.photo))
    .sort((a, b) => a.bird.taxonomicOrder - b.bird.taxonomicOrder || a.bird.commonName.localeCompare(b.bird.commonName));
}

export function getRecentPhotos(birds: Species[]): RankedPhoto[] {
  const newestFirst = birds
    .flatMap((bird) => bird.photos.map((photo) => ({ bird, photo })))
    .sort((a, b) => newestMediaSort(a.photo, b.photo));

  const seen = new Set<string>();
  return newestFirst.filter(({ bird }) => {
    if (seen.has(bird.code)) return false;
    seen.add(bird.code);
    return true;
  });
}
