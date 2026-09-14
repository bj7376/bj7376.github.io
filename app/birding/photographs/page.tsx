import Link from "next/link";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { TaxonomicPhotoArchive } from "@/components/PhotoArchive";
import { getBirdingSpecies } from "@/lib/birding";

export const metadata = { title: "Photographs" };
export const dynamic = "force-dynamic";

export default async function PhotographsPage() {
  const birds = await getBirdingSpecies();

  return (
    <section className="birding-page photographs-page">
      <header className="birding-minimal-header">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </header>

      <section className="birding-section archive-section photographs-full-section">
        <div className="minimal-section-heading"><h1>All photographs</h1></div>
        <TaxonomicPhotoArchive birds={birds} />
        <Link className="back-link" href="/birding">← Back</Link>
      </section>
    </section>
  );
}
