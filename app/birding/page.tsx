import Link from "next/link";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { RecentPhotoStrip } from "@/components/PhotoArchive";
import { getBirdingSpecies, getRecentPhotos, groupedSpecies } from "@/lib/birding";

export const metadata = { title: "Birding" };
export const dynamic = "force-dynamic";

export default async function BirdingPage() {
  const birds = await getBirdingSpecies();
  const groups = groupedSpecies(birds);
  const recentPhotos = getRecentPhotos(birds);

  return (
    <section className="birding-page">
      <header className="birding-minimal-header">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </header>

      <div className="all-photographs-link-row">
        <Link href="/birding/photographs">View the latest photograph of every species ↗</Link>
      </div>

      <section className="field-guide minimal-field-guide">
        <div className="field-guide-index">
          {Object.entries(groups).map(([order, families]) => (
            <section className="taxon-order" key={order}>
              <div className="order-index"><h3>{order}</h3></div>
              <div className="family-list">
                {Object.entries(families).map(([family, familyBirds]) => (
                  <div className="family-row" key={family}>
                    <div className="family-name">
                      <span>{familyBirds[0]?.family}</span>
                      <strong>{family}</strong>
                    </div>
                    <div className="species-list">
                      {familyBirds.map((bird) => (
                        <a href={`/birding/species/${bird.code}`} key={bird.code}>
                          <BirdName bird={bird} />
                          <em>{bird.scientificName}</em>
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

      <section className="birding-section recent-photo-section">
        <div className="minimal-section-heading"><h2>Recent photographs</h2></div>
        <RecentPhotoStrip photos={recentPhotos} limit={10} />
      </section>
    </section>
  );
}
