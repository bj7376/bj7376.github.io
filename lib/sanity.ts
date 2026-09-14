export type SanityAsset = { url?: string; metadata?: { dimensions?: { width?: number; height?: number; aspectRatio?: number } } };
export type SanityImage = { asset?: SanityAsset; alt?: string; caption?: string; hotspot?: unknown; crop?: unknown };
export type PortableMarkDef = { _key: string; _type: string; href?: string; openInNewTab?: boolean };
export type PortableSpan = { _key: string; _type: "span"; text: string; marks?: string[] };
export type PortableBlock = { _key: string; _type: "block"; style?: string; children?: PortableSpan[]; markDefs?: PortableMarkDef[]; listItem?: "bullet" | "number"; level?: number };
export type ProjectImageBlock = SanityImage & { _key: string; _type: "projectImage" };
export type ProjectGalleryBlock = { _key: string; _type: "imageGallery"; images?: SanityImage[] };
export type VideoEmbedBlock = { _key: string; _type: "videoEmbed"; url?: string; caption?: string };
export type ProjectBodyItem = PortableBlock | ProjectImageBlock | ProjectGalleryBlock | VideoEmbedBlock;

export type SanityProject = {
  _id: string; title: string; slug: string; year: number; type?: string; venue?: string;
  subtitle?: string; summary?: string; sortOrder?: number; coverImage?: SanityImage; body?: ProjectBodyItem[];
};
export type SanityBio = { _id: string; name: string; intro?: PortableBlock[]; portrait?: SanityImage; emailAddress?: string; googleScholarUrl?: string; ebirdUrl?: string; cvUrl?: string };
export type SanityPublication = { _id: string; title: string; authors: string; venue: string; year: number; url?: string; note?: string; sortOrder?: number };
export type SanityAward = { _id: string; title: string; organization?: string; year: number; note?: string; url?: string; sortOrder?: number };
export type SanityExhibition = { _id: string; title: string; venue?: string; location?: string; year: number; url?: string; sortOrder?: number };

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "v7yxu61r";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2026-09-14";

async function sanityQuery<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const search = new URLSearchParams({query, perspective: "published"});
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value));
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${search.toString()}`;
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) throw new Error(`Sanity query failed (${response.status})`);
  const payload = (await response.json()) as {result: T};
  return payload.result;
}

async function safeQuery<T>(query: string, fallback: T, params: Record<string, unknown> = {}): Promise<T> {
  try { return await sanityQuery<T>(query, params); }
  catch (error) { console.error("Sanity fetch failed; using the local fallback.", error); return fallback; }
}

const PROJECT_LIST_QUERY = `*[_type == "project" && defined(slug.current)] | order(sortOrder asc, year desc, title asc){_id,title,"slug":slug.current,year,type,venue,subtitle,summary,sortOrder,coverImage{alt,caption,hotspot,crop,asset->{url,metadata{dimensions}}}}`;
const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{_id,title,"slug":slug.current,year,type,venue,subtitle,summary,sortOrder,coverImage{alt,caption,hotspot,crop,asset->{url,metadata{dimensions}}},body[]{...,_type == "projectImage" => {alt,caption,hotspot,crop,asset->{url,metadata{dimensions}}},_type == "imageGallery" => {images[]{alt,caption,hotspot,crop,asset->{url,metadata{dimensions}}}}}}`;
const BIO_QUERY = `*[_type == "bio"][0]{_id,name,intro,emailAddress,googleScholarUrl,ebirdUrl,cvUrl,portrait{alt,caption,hotspot,crop,asset->{url,metadata{dimensions}}}}`;
const PUBLICATIONS_QUERY = `*[_type == "publication"] | order(year desc, sortOrder asc, title asc){_id,title,authors,venue,year,url,note,sortOrder}`;
const AWARDS_QUERY = `*[_type == "award"] | order(year desc, sortOrder asc, title asc){_id,title,organization,year,note,url,sortOrder}`;
const EXHIBITIONS_QUERY = `*[_type == "exhibition"] | order(year desc, sortOrder asc, title asc){_id,title,venue,location,year,url,sortOrder}`;

export function getSanityProjects(){ return safeQuery<SanityProject[]>(PROJECT_LIST_QUERY, []); }
export function getSanityProject(slug: string){ return safeQuery<SanityProject | null>(PROJECT_QUERY, null, {slug}); }
export function getSanityBio(){ return safeQuery<SanityBio | null>(BIO_QUERY, null); }
export function getSanityPublications(){ return safeQuery<SanityPublication[]>(PUBLICATIONS_QUERY, []); }
export function getSanityAwards(){ return safeQuery<SanityAward[]>(AWARDS_QUERY, []); }
export function getSanityExhibitions(){ return safeQuery<SanityExhibition[]>(EXHIBITIONS_QUERY, []); }
