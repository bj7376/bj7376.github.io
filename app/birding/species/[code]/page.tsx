import { notFound } from "next/navigation";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { getHeroPhoto, getSpecies, species } from "@/lib/birding";

export function generateStaticParams() {
  return species.map((bird) => ({ code: bird.code }));
}

export default async function SpeciesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const bird = getSpecies(code);
  if (!bird) notFound();
  const heroPhoto = getHeroPhoto(bird);
  const photos = [...bird.photos].sort((a, b) => {
    const score = (b.rating ?? 0) - (a.rating ?? 0);
    return score || (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
  });

  const relatedChecklists = [
    { date: "18 Apr 2026", place: "Seocheon, South Korea" },
    { date: "04 Oct 2025", place: bird.photos[0]?.location ?? "South Korea" },
    { date: "21 Sep 2024", place: "West coast, South Korea" },
  ];

  return (
    <article className="species-page">
      <div className="species-language-row"><span className="bird-language-label">Bird names</span><BirdingLanguageToggle /></div>
      <header className="species-header minimal-species-header">
        <div>
          <p className="taxon-path">{bird.order} / {bird.family}</p>
          <h1><BirdName bird={bird} /></h1>
          <p className="scientific-name">{bird.scientificName}</p>
        </div>
      </header>

      <figure className="species-hero-image">
        <div aria-hidden="true">
          {heroPhoto?.src ? <img src={heroPhoto.src} alt="" /> : <span>{bird.commonName.slice(0, 1)}</span>}
        </div>
        {heroPhoto && <figcaption>{heroPhoto.location} · {heroPhoto.takenAt}</figcaption>}
      </figure>

      <section className="species-section">
        <div className="minimal-section-heading"><h2>Photographs</h2></div>
        <div className="photo-index-grid species-photo-grid">
          {photos.map((photo) => (
            <figure className="species-photo" key={photo.id}>
              <div className="photo-index-image">
                {photo.src ? <img src={photo.src} alt="" /> : <span>{bird.commonName.slice(0, 1)}</span>}
              </div>
              <figcaption>{photo.location} · {photo.takenAt}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="species-section observation-section">
        <div className="minimal-section-heading"><h2>Related checklists</h2></div>
        <div className="observation-list related-checklist-list">
          {relatedChecklists.map((checklist, index) => (
            <div key={`${checklist.date}-${index}`}>
              <time>{checklist.date}</time>
              <strong>{checklist.place}</strong>
              <span>↗</span>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
