import Link from "next/link";
import { BirdName } from "@/components/BirdName";
import { BirdOrderIndex } from "@/components/BirdOrderIndex";
import { BirdingToolbar } from "@/components/BirdingToolbar";
import { RecentPhotoStrip } from "@/components/PhotoArchive";
import { getBirdingSpecies, getRecentPhotos, groupedSpecies, type Species } from "@/lib/birding";
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

const ORDER_LABELS: Record<string, { en: string; ko: string }> = {
  Anseriformes: { en: "Ducks & geese", ko: "오리·기러기류" },
  Galliformes: { en: "Gamebirds", ko: "닭·꿩류" },
  Columbiformes: { en: "Pigeons & doves", ko: "비둘기류" },
  Cuculiformes: { en: "Cuckoos", ko: "두견이·뻐꾸기류" },
  Apodiformes: { en: "Swifts", ko: "칼새류" },
  Gruiformes: { en: "Cranes & rails", ko: "두루미·뜸부기류" },
  Charadriiformes: { en: "Shorebirds & gulls", ko: "도요·물떼새류" },
  Podicipediformes: { en: "Grebes", ko: "논병아리류" },
  Ciconiiformes: { en: "Storks", ko: "황새류" },
  Suliformes: { en: "Cormorants", ko: "가마우지류" },
  Pelecaniformes: { en: "Herons & allies", ko: "백로·왜가리류" },
  Accipitriformes: { en: "Hawks & eagles", ko: "수리류" },
  Strigiformes: { en: "Owls", ko: "올빼미류" },
  Bucerotiformes: { en: "Hoopoes", ko: "후투티류" },
  Coraciiformes: { en: "Kingfishers & rollers", ko: "물총새·파랑새류" },
  Piciformes: { en: "Woodpeckers", ko: "딱따구리류" },
  Falconiformes: { en: "Falcons", ko: "매류" },
  Passeriformes: { en: "Passerines", ko: "참새류" },
};

function orderAnchorId(order: string) {
  return `order-${order.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function groupByGenus(birds: Species[]) {
  return birds.reduce<Array<{ genus: string; birds: Species[] }>>((groups, bird) => {
    const genus = bird.scientificName.trim().split(/\s+/)[0] || "Other";
    const previous = groups[groups.length - 1];

    if (previous?.genus === genus) {
      previous.birds.push(bird);
    } else {
      groups.push({ genus, birds: [bird] });
    }

    return groups;
  }, []);
}

export default async function BirdingPage() {
  const [birds, lastUpdated] = await Promise.all([
    getBirdingSpecies(),
    getBirdingLastUpdated(),
  ]);
  const groups = groupedSpecies(birds);
  const recentPhotos = getRecentPhotos(birds);
  const searchBirds = birds.map(({ slug, commonName, koreanName, scientificName }) => ({ slug, commonName, koreanName, scientificName }));
  const orderIndex = Object.entries(groups).map(([order, families]) => {
    const labels = ORDER_LABELS[order] || { en: order, ko: order };
    return {
      id: orderAnchorId(order),
      order,
      labelEn: labels.en,
      labelKo: labels.ko,
    };
  });

  return (
    <section className="birding-page">
      <BirdingToolbar birds={searchBirds} />

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
                    <section className="family-row" key={family}>
                      <div className="family-name">
                        <span>{familyBirds[0]?.family}</span>
                        <strong>{family}</strong>
                      </div>

                      <div className="species-list">
                        {groupByGenus(familyBirds).map(({ genus, birds: genusBirds }) => (
                          <div className="genus-group" key={genus}>
                            <h4 className="genus-heading">{genus}</h4>
                            <div className="genus-species-list">
                              {genusBirds.map((bird) => {
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
