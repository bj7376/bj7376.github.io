import Link from "next/link";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdName } from "@/components/BirdName";
import { BirdSearch } from "@/components/BirdSearch";
import { BirdOrderIndex } from "@/components/BirdOrderIndex";
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

const ORDER_KOREAN_LABELS: Record<string, string> = {
  Anseriformes: "오리·기러기류",
  Galliformes: "닭·꿩류",
  Columbiformes: "비둘기류",
  Cuculiformes: "두견이·뻐꾸기류",
  Apodiformes: "칼새류",
  Gruiformes: "두루미·뜸부기류",
  Charadriiformes: "도요·물떼새류",
  Podicipediformes: "논병아리류",
  Ciconiiformes: "황새류",
  Suliformes: "가마우지류",
  Pelecaniformes: "백로·왜가리류",
  Accipitriformes: "수리류",
  Strigiformes: "올빼미류",
  Bucerotiformes: "후투티류",
  Coraciiformes: "물총새·파랑새류",
  Piciformes: "딱따구리류",
  Falconiformes: "매류",
  Passeriformes: "참새류",
};

function orderAnchorId(order: string) {
  return `order-${order.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export default async function BirdingPage() {
  const [birds, lastUpdated] = await Promise.all([
    getBirdingSpecies(),
    getBirdingLastUpdated(),
  ]);
  const groups = groupedSpecies(birds);
  const orderIndex = Object.entries(groups).map(([order, families]) => ({
    id: orderAnchorId(order),
    order,
    label: ORDER_KOREAN_LABELS[order] || order,
    count: Object.values(families).reduce((total, familyBirds) => total + familyBirds.length, 0),
  }));
  const recentPhotos = getRecentPhotos(birds);
  const searchBirds = birds.map(({ slug, commonName, koreanName, scientificName }) => ({ slug, commonName, koreanName, scientificName }));

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
        <div className="field-guide-body">
          <BirdOrderIndex orders={orderIndex} />
          <div className="field-guide-index">
          {Object.entries(groups).map(([order, families]) => (
            <section className="taxon-order" id={orderAnchorId(order)} data-bird-order key={order}>
              <div className="order-index"><h3>{order}</h3></div>
              <div className="family-list">
                {Object.entries(families).map(([family, familyBirds]) => (
                  <div className="family-row" key={family}>
                    <div className="family-name">
                      <span>{familyBirds[0]?.family}</span>
                      <strong>{family}</strong>
                    </div>
                    <div className="species-list">
                      {familyBirds.map((bird) => {
                        const observationOnly = bird.photos.length === 0
                          && bird.videos.length === 0
                          && bird.audio.length === 0
                          && bird.observationLocations.length > 0;

                        return (
                          <a
                            href={`/birding/species/${bird.slug}`}
                            className={observationOnly ? "observation-only" : undefined}
                            key={bird.code}
                          >
                            <BirdName bird={bird} />
                            <em>{bird.scientificName}</em>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          </div>
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
