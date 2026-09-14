import { getHeroPhoto, groupedSpecies, type RankedPhoto, type Species } from "@/lib/birding";

function PhotoItem({ item, recent = false }: { item: RankedPhoto; recent?: boolean }) {
  return (
    <a className="photo-index-item" href={item.photo.sourceUrl} target="_blank" rel="noreferrer">
      <div className="photo-index-image" aria-hidden="true">
        {item.photo.src ? <img src={item.photo.src} alt="" /> : <span>{item.bird.commonName.slice(0, 1)}</span>}
      </div>
      <div className="photo-index-caption">
        <span className="bird-name-en">{item.bird.commonName}</span>
        <span className="bird-name-ko ko-font" lang="ko">{item.bird.koreanName}</span>
        {recent && <time>{item.photo.takenAt}</time>}
      </div>
    </a>
  );
}

export function RecentPhotoStrip({ photos, limit = 10 }: { photos: RankedPhoto[]; limit?: number }) {
  return (
    <div className="photo-index-grid photo-index-grid-recent">
      {photos.slice(0, limit).map((item) => <PhotoItem recent item={item} key={`${item.bird.code}-${item.photo.id}`} />)}
    </div>
  );
}

export function TaxonomicPhotoArchive({ birds }: { birds: Species[] }) {
  const groups = groupedSpecies(birds);

  return (
    <div className="photo-taxonomy-archive">
      {Object.entries(groups).map(([order, families]) => (
        <section className="photo-taxon-order" key={order}>
          <div className="photo-order-index"><h2>{order}</h2></div>
          <div className="photo-family-list">
            {Object.entries(families).map(([family, familyBirds]) => {
              const items = familyBirds
                .map((bird) => ({ bird, photo: getHeroPhoto(bird) }))
                .filter((item): item is RankedPhoto => Boolean(item.photo));

              if (!items.length) return null;

              return (
                <section className="photo-family-row" key={family}>
                  <div className="photo-family-name">
                    <span>{familyBirds[0]?.family}</span>
                    <strong>{family}</strong>
                  </div>
                  <div className="photo-index-grid photo-index-grid-taxonomic">
                    {items.map((item) => <PhotoItem item={item} key={`${item.bird.code}-${item.photo.id}`} />)}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
