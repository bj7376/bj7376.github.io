import Link from "next/link";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { BirdSearch } from "@/components/BirdSearch";
import { RecentPhotoStrip } from "@/components/PhotoArchive";
import { getBirdingSpecies, getRecentPhotos, groupedSpecies } from "@/lib/birding";
import { getBirdingLastUpdated } from "@/lib/birding-status";

export const metadata = { title: "Birding" };
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function displayUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function BirdingPage() {
  const [birds, lastUpdated] = await Promise.all([
    getBirdingSpecies(),
    getBirdingLastUpdated(),
  ]);
  const groups = groupedSpecies(birds);
  const recentPhotos = getRecentPhotos(birds);
  const searchBirds = birds.map(({ code, commonName, koreanName, scientificName }) => ({ code, commonName, koreanName, scientificName }));

  return (
    <section className="birding-page">
      <header className="birding-minimal-header">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </header>

      <section className="birding-section bird-search-section">
        <div className="minimal-section-heading"><h2>Search</h2></div>
        <BirdSearch birds={searchBirds} />
      </section>

      <section className="field-guide minimal-field-guide">
        <div className="field-guide-title"><h2>My own bird guide</h2></div>
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

      <div className="all-photographs-link-row all-photographs-link-bottom">
        <Link href="/birding/photographs">View the latest photograph of every species ↗</Link>
      </div>

      {lastUpdated && (
        <div className="all-photographs-link-row birding-update-row">
          <span className="birding-update-note">This page was last updated on {displayUpdatedDate(lastUpdated)}.</span>
        </div>
      )}
    </section>
  );
}
