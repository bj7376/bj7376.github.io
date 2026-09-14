import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { RatedPhotoArchive, RecentPhotoStrip } from "@/components/PhotoArchive";
import { getRatedSpeciesRepresentatives, getRecentPhotos, groupedSpecies } from "@/lib/birding";

export const metadata = { title: "Birding" };

export default function BirdingPage() {
  const groups = groupedSpecies();
  const ratedPhotos = getRatedSpeciesRepresentatives();
  const recentPhotos = getRecentPhotos();

  return (
    <section className="birding-page">
      <header className="birding-minimal-header">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </header>

      <section className="field-guide minimal-field-guide">
        <div className="field-guide-index">
          {Object.entries(groups).map(([order, families]) => (
            <section className="taxon-order" key={order}>
              <div className="order-index"><h3>{order}</h3></div>
              <div className="family-list">
                {Object.entries(families).map(([family, birds]) => (
                  <div className="family-row" key={family}>
                    <div className="family-name">
                      <span>{birds[0]?.family}</span>
                      <strong>{family}</strong>
                    </div>
                    <div className="species-list">
                      {birds.map((bird) => (
                        <a href={`/birding/species/${bird.code}`} key={bird.code}>
                          <BirdName bird={bird} />
                          <em>{bird.scientificName}</em>
                          <small>{bird.photoCount} / {bird.observations}</small>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="birding-section archive-section">
        <div className="minimal-section-heading"><h2>All photographs</h2></div>
        <RatedPhotoArchive photos={ratedPhotos} limit={5} showMore />
      </section>

      <section className="birding-section recent-photo-section">
        <div className="minimal-section-heading"><h2>Recent photographs</h2></div>
        <RecentPhotoStrip photos={recentPhotos} limit={5} />
      </section>
    </section>
  );
}
