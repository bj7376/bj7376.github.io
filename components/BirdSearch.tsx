"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SearchBird = {
  code: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\s\-–—'’._()]+/g, "");
}

export function BirdSearch({ birds }: { birds: SearchBird[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return [];
    return birds
      .filter((bird) => [bird.commonName, bird.koreanName, bird.scientificName].some((name) => normalize(name).includes(needle)))
      .slice(0, 8);
  }, [birds, query]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (results[0]) router.push(`/birding/species/${results[0].code}`);
  }

  return (
    <form className="bird-search" role="search" onSubmit={submit}>
      <div className="bird-search-input-wrap">
        <input
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="Search species / 종명 검색"
          aria-label="Search species by English, Korean, or scientific name"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
        />
        {open && query.trim() && (
          <div className="bird-search-results" role="listbox">
            {results.length > 0 ? results.map((bird) => (
              <Link
                key={bird.code}
                href={`/birding/species/${bird.code}`}
                role="option"
                onClick={() => setOpen(false)}
              >
                <span className="bird-search-common">{bird.commonName}</span>
                <span className="bird-search-korean ko-font" lang="ko">{bird.koreanName}</span>
                <em>{bird.scientificName}</em>
              </Link>
            )) : <p className="bird-search-empty">No matching species</p>}
          </div>
        )}
      </div>
    </form>
  );
}
