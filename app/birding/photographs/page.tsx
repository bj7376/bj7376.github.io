import Link from "next/link";
import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { RatedPhotoArchive } from "@/components/PhotoArchive";
import { getRatedSpeciesRepresentatives } from "@/lib/birding";

export const metadata = { title: "Photographs" };

export default function PhotographsPage() {
  const photos = getRatedSpeciesRepresentatives();

  return (
    <section className="birding-page photographs-page">
      <header className="birding-minimal-header">
        <span className="bird-language-label">Bird names</span>
        <BirdingLanguageToggle />
      </header>

      <section className="birding-section archive-section photographs-full-section">
        <div className="minimal-section-heading"><h1>All photographs</h1></div>
        <RatedPhotoArchive photos={photos} />
        <Link className="back-link" href="/birding">← Back</Link>
      </section>
    </section>
  );
}
