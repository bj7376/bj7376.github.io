"use client";

import { useEffect, useState } from "react";

const BOTTOM_TOLERANCE = 4;

export function BirdingScrollButton() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      setAtBottom(
        scrollBottom >= document.documentElement.scrollHeight - BOTTOM_TOLERANCE,
      );
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  function handleClick() {
    window.scrollTo({
      top: atBottom ? 0 : document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      className="birding-scroll-button"
      onClick={handleClick}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      title={atBottom ? "Top" : "Bottom"}
    >
      <span aria-hidden="true">{atBottom ? "↑" : "↓"}</span>
    </button>
  );
}
