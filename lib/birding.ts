import { cache } from "react";

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

export type ObservationLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
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
  observationLocations: ObservationLocation[];
  relatedChecklists: RelatedChecklist[];
  hasMedia?: boolean;
  hasObservation?: boolean;
};

export type RankedPhoto = { bird: Species; photo: BirdPhoto };

type DbBirdingIndex = {
  species_code: string;
  ebird_species_code: string | null;
  common_name: string;
  scientific_name: string;
  korean_name: string | null;
  taxonomic_order: number | null;
  order_name: string | null;
  family_common_name: string | null;
  family_scientific_name: string | null;
  has_media: boolean;
  has_observation: boolean;
  latest_photo_id: number | null;
  latest_photo_taken_at: string | null;
  latest_photo_location: string | null;
};

type DbMedia = {
  ml_asset_id: number;
  checklist_id: string | null;
  media_type: string | null;
  taken_at: string | null;
  location_name: string | null;
  source_url: string | null;
  thumbnail_url: string | null;
};

type DbSpeciesLocation = {
  species_code: string;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifqrvugxfmeclaqadqbd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcXJ2dWd4Zm1lY2xhcWFkcWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI3MzcsImV4cCI6MjEwNDk2ODczN30.M3iMKEBs8JFzboUWBCt3CtYCbqIma8zmQ7KL2LqWE9Y";

const INDEX_SELECT = [
  "species_code",
  "ebird_species_code",
  "common_name",
  "scientific_name",
  "korean_name",
  "taxonomic_order",
  "order_name",
  "family_common_name",
  "family_scientific_name",
  "has_media",
  "has_observation",
  "latest_photo_id",
  "latest_photo_taken_at",
  "latest_photo_location",
].join(",");

const MEDIA_SELECT = [
  "ml_asset_id",
  "checklist_id",
  "media_type",
  "taken_at",
  "location_name",
  "source_url",
  "thumbnail_url",
].join(",");

async function fetchRows<T>(resource: string, params: Record<string, string>): Promise<T[]> {
  const search = new URLSearchParams(params);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${resource}?${search.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase ${resource} request failed: ${response.status}`);
  }

  return (await response.json()) as T[];
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

function baseSpecies(row: DbBirdingIndex): Omit<Species, "photos" | "videos" | "audio" | "observationLocations" | "relatedChecklists"> {
  const commonName = row.common_name.trim();
  const family = row.family_scientific_name?.trim() || "Unclassified";

  return {
    code: row.species_code,
    slug: row.ebird_species_code?.trim() || row.species_code,
    commonName,
    koreanName: row.korean_name?.trim() || commonName,
    scientificName: row.scientific_name,
    order: row.order_name?.trim() || "Unclassified",
    family,
    familyCommon: row.family_common_name?.trim() || family,
    taxonomicOrder: row.taxonomic_order ?? Number.MAX_SAFE_INTEGER,
    hasMedia: row.has_media,
    hasObservation: row.has_observation,
  };
}

function indexPhoto(row: DbBirdingIndex): BirdPhoto | undefined {
  if (row.latest_photo_id === null) return undefined;

  const takenAt = dateOnly(row.latest_photo_taken_at);
  return {
    id: String(row.latest_photo_id),
    label: row.common_name.trim(),
    year: takenAt ? Number(takenAt.slice(0, 4)) : 0,
    takenAt,
    location: row.latest_photo_location || "",
    src: `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${row.latest_photo_id}/1200`,
    sourceUrl: `https://macaulaylibrary.org/asset/${row.latest_photo_id}`,
    mediaType: "photo",
  };
}

function mediaFromRow(item: DbMedia, commonName: string): BirdMedia {
  const kind = mediaKind(item.media_type);
  const takenAt = dateOnly(item.taken_at);

  return {
    id: String(item.ml_asset_id),
    label: commonName,
    year: takenAt ? Number(takenAt.slice(0, 4)) : 0,
    takenAt,
    location: item.location_name || "",
    src: item.thumbnail_url || (kind === "photo"
      ? `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${item.ml_asset_id}/1200`
      : undefined),
    sourceUrl: item.source_url || `https://macaulaylibrary.org/asset/${item.ml_asset_id}`,
    checklistId: item.checklist_id ?? undefined,
    mediaType: kind,
  };
}

async function getIndexRow(code: string): Promise<DbBirdingIndex | null> {
  const rows = await fetchRows<DbBirdingIndex>("public_birding_species_index", {
    select: INDEX_SELECT,
    or: `(species_code.eq.${code},ebird_species_code.eq.${code})`,
    limit: "1",
  });

  return rows[0] ?? null;
}

export const getBirdingSpecies = cache(async (): Promise<Species[]> => {
  const rows = await fetchRows<DbBirdingIndex>("public_birding_species_index", {
    select: INDEX_SELECT,
    order: "taxonomic_order.asc.nullslast,common_name.asc",
  });

  return rows.map((row) => {
    const photo = indexPhoto(row);
    return {
      ...baseSpecies(row),
      photos: photo ? [photo] : [],
      videos: [],
      audio: [],
      observationLocations: [],
      relatedChecklists: [],
    };
  });
});

export const getBirdingSpeciesDetail = cache(async (code: string): Promise<Species | null> => {
  const row = await getIndexRow(code);
  if (!row) return null;

  const [mediaRows, locationRows] = await Promise.all([
    fetchRows<DbMedia>("media", {
      select: MEDIA_SELECT,
      species_code: `eq.${row.species_code}`,
      is_public: "eq.true",
    }),
    fetchRows<DbSpeciesLocation>("public_species_locations", {
      select: "species_code,location_id,location_name,latitude,longitude",
      species_code: `eq.${row.species_code}`,
    }),
  ]);

  const base = baseSpecies(row);
  const allMedia = mediaRows.map((item) => mediaFromRow(item, base.commonName));
  const photos = allMedia.filter((item) => item.mediaType === "photo").sort(newestMediaSort);
  const videos = allMedia.filter((item) => item.mediaType === "video").sort(newestMediaSort);
  const audio = allMedia.filter((item) => item.mediaType === "audio").sort(newestMediaSort);

  const checklistMap = new Map<string, RelatedChecklist>();
  for (const item of allMedia) {
    if (!item.checklistId) continue;
    checklistMap.set(item.checklistId, {
      id: item.checklistId,
      date: item.takenAt,
      place: item.location,
      url: `https://ebird.org/checklist/${item.checklistId}`,
    });
  }
  const relatedChecklists = [...checklistMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  const observationLocations = locationRows.map<ObservationLocation>((item) => ({
    id: item.location_id,
    name: item.location_name,
    latitude: item.latitude,
    longitude: item.longitude,
  }));

  return {
    ...base,
    photos,
    videos,
    audio,
    observationLocations,
    relatedChecklists,
  };
});

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
  return birds
    .map((bird) => ({ bird, photo: getHeroPhoto(bird) }))
    .filter((item): item is RankedPhoto => Boolean(item.photo))
    .sort((a, b) => newestMediaSort(a.photo, b.photo));
}
