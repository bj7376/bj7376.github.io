import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { SpeciesObservationMap } from "@/components/SpeciesObservationMap";
import { getBirdingSpecies, getHeroPhoto, getSpecies, type BirdMedia } from "@/lib/birding";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type SpeciesPageProps = { params: Promise<{ code: string }> };

function displayDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export async function generateMetadata({ params }: SpeciesPageProps): Promise<Metadata> {
  const { code } = await params;
  const birds = await getBirdingSpecies();
  const bird = getSpecies(birds, code);

  if (!bird) return { title: "Birding" };

  const title = bird.commonName;
  const fullTitle = `${bird.commonName} — Byoungjae Kim`;
  const description = `${bird.commonName} (${bird.scientificName}) in Byoungjae Kim's personal birding archive.`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

function MediaRows({ items }: { items: BirdMedia[] }) {
  return (
    <div className="species-media-list">
      {items.map((item) => (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" key={item.id}>
          <time>{displayDate(item.takenAt)}</time>
          <strong>{item.location || "Macaulay Library"}</strong>
          <span>ML{item.id}</span>
          <span>↗</span>
        </a>
      ))}
    </div>
  );
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { code } = await params;
  const birds = await getBirdingSpecies();
  const bird = getSpecies(birds, code);
  if (!bird) notFound();
  if (code !== bird.slug) permanentRedirect(`/birding/species/${bird.slug}`);

  const heroPhoto = getHeroPhoto(bird);
  const heroPhotoSrc = heroPhoto
    ? `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${heroPhoto.id}/2400`
    : undefined;
  const photos = bird.photos.filter((photo) => photo.id !== heroPhoto?.id);

  return (
    <article className="species-page">
      <div className="species-language-row">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </div>

      <header className="species-header minimal-species-header">
        <div>
          <p className="taxon-path">{bird.order} / {bird.family}</p>
          <h1><BirdName bird={bird} /></h1>
          <p className="scientific-name">{bird.scientificName}</p>
        </div>
      </header>

      {heroPhoto && (
        <figure className="species-hero-image">
          <a className="species-hero-link" href={heroPhoto.sourceUrl} target="_blank" rel="noreferrer">
            <div aria-hidden="true">
              {heroPhotoSrc ? <img src={heroPhotoSrc} alt="" fetchPriority="high" /> : <span>{bird.commonName.slice(0, 1)}</span>}
            </div>
            <figcaption>{heroPhoto.location} · {heroPhoto.takenAt}</figcaption>
          </a>
        </figure>
      )}

      {bird.observationLocations.length > 0 && (
        <section className="species-section species-map-section">
          <div className="minimal-section-heading"><h2>Observed locations</h2></div>
          <SpeciesObservationMap points={bird.observationLocations} />
        </section>
      )}

      {photos.length > 0 && (
        <section className="species-section">
          <div className="minimal-section-heading"><h2>Photographs</h2></div>
          <div className="photo-index-grid species-photo-grid">
            {photos.map((photo) => (
              <figure className="species-photo" key={photo.id}>
                <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                  <div className="photo-index-image">
                    {photo.src ? <img src={photo.src} alt="" /> : <span>{bird.commonName.slice(0, 1)}</span>}
                  </div>
                  <figcaption>{photo.location} · {photo.takenAt}</figcaption>
                </a>
              </figure>
            ))}
          </div>
        </section>
      )}

      {bird.videos.length > 0 && (
        <section className="species-section species-media-section">
          <div className="minimal-section-heading"><h2>Videos</h2></div>
          <MediaRows items={bird.videos} />
        </section>
      )}

      {bird.audio.length > 0 && (
        <section className="species-section species-media-section">
          <div className="minimal-section-heading"><h2>Audio</h2></div>
          <MediaRows items={bird.audio} />
        </section>
      )}

      <section className="species-section observation-section">
        <div className="minimal-section-heading"><h2>Related checklists</h2></div>
        <div className="observation-list related-checklist-list">
          {bird.relatedChecklists.map((checklist) => (
            <a href={checklist.url} target="_blank" rel="noreferrer" key={checklist.id}>
              <time>{displayDate(checklist.date)}</time>
              <strong>{checklist.place}</strong>
              <span>↗</span>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
