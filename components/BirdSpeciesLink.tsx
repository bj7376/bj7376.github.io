"use client";

import { useRef, useState } from "react";

type BirdSpeciesLinkProps = {
  href: string;
  commonName: string;
  koreanName: string;
  scientificName: string;
  photoSrc?: string;
  observationOnly?: boolean;
};

type PreviewPosition = {
  top: number;
  left: number;
};

const PREVIEW_DELAY_MS = 140;
const PREVIEW_WIDTH = 240;
const PREVIEW_HEIGHT = 180;
const PREVIEW_GAP = 18;
const VIEWPORT_GAP = 24;
const STICKY_TOP = 156;

export function BirdSpeciesLink({
  href,
  commonName,
  koreanName,
  scientificName,
  photoSrc,
  observationOnly = false,
}: BirdSpeciesLinkProps) {
  const timerRef = useRef<number | null>(null);
  const [preview, setPreview] = useState<PreviewPosition | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function showPreview(element: HTMLAnchorElement, delayed: boolean) {
    if (!photoSrc || window.matchMedia("(max-width: 1100px), (hover: none)").matches) return;

    clearTimer();

    const open = () => {
      const rect = element.getBoundingClientRect();
      const left = Math.min(
        rect.right + PREVIEW_GAP,
        window.innerWidth - PREVIEW_WIDTH - VIEWPORT_GAP,
      );
      const top = Math.min(
        Math.max(rect.top - 18, STICKY_TOP),
        window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_GAP,
      );
      setPreview({ top, left });
    };

    if (delayed) {
      timerRef.current = window.setTimeout(open, PREVIEW_DELAY_MS);
    } else {
      open();
    }
  }

  function hidePreview() {
    clearTimer();
    setPreview(null);
  }

  return (
    <>
      <a
        href={href}
        className={observationOnly ? "observation-only" : undefined}
        onMouseEnter={(event) => showPreview(event.currentTarget, true)}
        onMouseLeave={hidePreview}
        onFocus={(event) => showPreview(event.currentTarget, false)}
        onBlur={hidePreview}
      >
        <span className="bird-name">
          <span className="bird-name-en">{commonName}</span>
          <span className="bird-name-ko ko-font" lang="ko">{koreanName}</span>
        </span>
        <em>{scientificName}</em>
      </a>

      {preview && photoSrc && (
        <div
          className="bird-species-hover-preview"
          style={{ top: preview.top, left: preview.left }}
          aria-hidden="true"
        >
          <img src={photoSrc} alt="" />
        </div>
      )}
    </>
  );
}
