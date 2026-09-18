import Link from "next/link";
import { BirdingToolbar } from "@/components/BirdingToolbar";
import { TaxonomicPhotoArchive } from "@/components/PhotoArchive";
import { getBirdingSpecies } from "@/lib/birding";

export const metadata = { title: "Photographs" };
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function PhotographsPage() {
  const birds = await getBirdingSpecies();
  const searchBirds = birds.map(({ slug, commonName, koreanName, scientificName }) => ({ slug, commonName, koreanName, scientificName }));

  return (
    <section className="birding-page photographs-page">
      <BirdingToolbar birds={searchBirds} />

      <section className="birding-section archive-section photographs-full-section">
        <div className="minimal-section-heading"><h1>All photographs</h1></div>
        <TaxonomicPhotoArchive birds={birds} />
        <Link className="back-link" href="/birding">← Back</Link>
      </section>
    </section>
  );
}
