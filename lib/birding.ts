export type BirdPhoto = {
  id: string;
  label: string;
  year: number;
  takenAt: string;
  location: string;
  rating?: number;
  ratingCount?: number;
  src?: string;
};

export type Species = {
  code: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
  order: string;
  family: string;
  familyCommon: string;
  observations: number;
  photoCount: number;
  firstSeen: number;
  latestSeen: number;
  photos: BirdPhoto[];
};

export type RankedPhoto = { bird: Species; photo: BirdPhoto };

export const species: Species[] = [
  { code: "fecur", commonName: "Far Eastern Curlew", koreanName: "알락꼬리마도요", scientificName: "Numenius madagascariensis", order: "Charadriiformes", family: "Scolopacidae", familyCommon: "Sandpipers and Allies", observations: 31, photoCount: 8, firstSeen: 2010, latestSeen: 2026, photos: [
    { id: "fecur-1", label: "Incoming tide", year: 2026, takenAt: "2026-09-08", location: "Seocheon", rating: 5, ratingCount: 18 },
    { id: "fecur-2", label: "Tidal flat", year: 2026, takenAt: "2026-08-24", location: "Hongseong", rating: 4.8, ratingCount: 11 },
    { id: "fecur-3", label: "Resting flock", year: 2025, takenAt: "2025-10-04", location: "Geum-gang", rating: 4.5, ratingCount: 7 },
  ]},
  { code: "rnstin", commonName: "Red-necked Stint", koreanName: "좀도요", scientificName: "Calidris ruficollis", order: "Charadriiformes", family: "Scolopacidae", familyCommon: "Sandpipers and Allies", observations: 44, photoCount: 12, firstSeen: 2008, latestSeen: 2026, photos: [
    { id: "rnstin-1", label: "Mudflat", year: 2026, takenAt: "2026-09-12", location: "Cheonsuman Bay", rating: 4.9, ratingCount: 26 },
    { id: "rnstin-2", label: "Foraging", year: 2026, takenAt: "2026-09-03", location: "Seocheon", rating: 4.6, ratingCount: 14 },
  ]},
  { code: "whoswa", commonName: "Whooper Swan", koreanName: "큰고니", scientificName: "Cygnus cygnus", order: "Anseriformes", family: "Anatidae", familyCommon: "Ducks, Geese, and Waterfowl", observations: 28, photoCount: 6, firstSeen: 2009, latestSeen: 2025, photos: [{ id: "whoswa-1", label: "Winter water", year: 2025, takenAt: "2025-12-28", location: "Eulsuk-do", rating: 4.9, ratingCount: 38 }]},
  { code: "rhiauk", commonName: "Rhinoceros Auklet", koreanName: "흰수염바다오리", scientificName: "Cerorhinca monocerata", order: "Charadriiformes", family: "Alcidae", familyCommon: "Auks, Murres, and Puffins", observations: 4, photoCount: 3, firstSeen: 2025, latestSeen: 2025, photos: [{ id: "rhiauk-1", label: "Offshore", year: 2025, takenAt: "2025-07-17", location: "Eastern Hokkaido", rating: 5, ratingCount: 41 }]},
  { code: "sibrub", commonName: "Siberian Rubythroat", koreanName: "진홍가슴", scientificName: "Calliope calliope", order: "Passeriformes", family: "Muscicapidae", familyCommon: "Old World Flycatchers", observations: 7, photoCount: 5, firstSeen: 2018, latestSeen: 2025, photos: [{ id: "sibrub-1", label: "Grassland", year: 2025, takenAt: "2025-07-13", location: "Eastern Hokkaido", rating: 4.7, ratingCount: 22 }]},
  { code: "cinvul", commonName: "Cinereous Vulture", koreanName: "독수리", scientificName: "Aegypius monachus", order: "Accipitriformes", family: "Accipitridae", familyCommon: "Hawks, Eagles, and Kites", observations: 19, photoCount: 7, firstSeen: 2012, latestSeen: 2026, photos: [{ id: "cinvul-1", label: "Winter sky", year: 2026, takenAt: "2026-01-19", location: "Miho-gang", rating: 4.8, ratingCount: 33 }]},
];

export function getSpecies(code: string) { return species.find((bird) => bird.code === code); }
export function groupedSpecies() { return species.reduce<Record<string, Record<string, Species[]>>>((acc, bird) => { acc[bird.order] ??= {}; acc[bird.order][bird.familyCommon] ??= []; acc[bird.order][bird.familyCommon].push(bird); return acc; }, {}); }
export function getHeroPhoto(bird: Species) { return [...bird.photos].sort((a,b) => ((b.rating ?? 0)-(a.rating ?? 0)) || ((b.ratingCount ?? 0)-(a.ratingCount ?? 0)))[0]; }
export function getRatedSpeciesRepresentatives(): RankedPhoto[] { return species.map((bird)=>({bird,photo:getHeroPhoto(bird)})).filter((item): item is RankedPhoto=>Boolean(item.photo)).sort((a,b)=>((b.photo.rating??0)-(a.photo.rating??0))||((b.photo.ratingCount??0)-(a.photo.ratingCount??0))||b.photo.takenAt.localeCompare(a.photo.takenAt)); }
export function getRecentPhotos(): RankedPhoto[] { return species.flatMap((bird)=>bird.photos.map((photo)=>({bird,photo}))).sort((a,b)=>b.photo.takenAt.localeCompare(a.photo.takenAt)); }
