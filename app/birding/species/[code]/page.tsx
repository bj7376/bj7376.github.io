import { notFound } from "next/navigation";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { getBirdingSpecies, getHeroPhoto, getSpecies } from "@/lib/birding";

export const dynamic = "force-dynamic";

function displayDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function SpeciesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const birds = await getBirdingSpecies();
  const bird = getSpecies(birds, code);
  if (!bird) notFound();

  const heroPhoto = getHeroPhoto(bird);
  const photos = bird.photos;

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
              {heroPhoto.src ? <img src={heroPhoto.src} alt="" /> : <span>{bird.commonName.slice(0, 1)}</span>}
            </div>
            <figcaption>{heroPhoto.location} · {heroPhoto.takenAt}</figcaption>
          </a>
        </figure>
      )}

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
