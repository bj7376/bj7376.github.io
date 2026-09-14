import Link from "next/link";
import type { Species } from "@/lib/birding";
import { BirdName } from "@/components/BirdName";

export function BirdTile({ bird }: { bird: Species }) {
  return (
    <Link className="bird-tile" href={`/birding/species/${bird.code}`}>
      <div className="bird-photo-placeholder"><span>{bird.commonName.slice(0, 1)}</span></div>
      <div><BirdName bird={bird} /><span>{bird.scientificName}</span></div>
    </Link>
  );
}
