import type { Species } from "@/lib/birding";

export function BirdName({ bird, className = "" }: { bird: Species; className?: string }) {
  return (
    <span className={`bird-name ${className}`}>
      <span className="bird-name-en">{bird.commonName}</span>
      <span className="bird-name-ko ko-font" lang="ko">{bird.koreanName}</span>
    </span>
  );
}
