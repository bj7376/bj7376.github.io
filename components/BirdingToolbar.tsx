import { BirdingLanguageToggle } from "@/components/BirdingLanguageToggle";
import { BirdSearch } from "@/components/BirdSearch";

type ToolbarBird = {
  slug: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
};

export function BirdingToolbar({ birds }: { birds: ToolbarBird[] }) {
  return (
    <div className="birding-toolbar">
      <span className="birding-toolbar-language-label">Bird names</span>
      <BirdingLanguageToggle />
      <span className="birding-toolbar-search-label">Search</span>
      <BirdSearch birds={birds} />
    </div>
  );
}
