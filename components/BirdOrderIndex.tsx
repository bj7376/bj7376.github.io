"use client";

import { useEffect, useRef, useState } from "react";

export type BirdOrderIndexItem = {
  id: string;
  order: string;
  labelEn: string;
  labelKo: string;
  count: number;
};

export function BirdOrderIndex({ orders }: { orders: BirdOrderIndexItem[] }) {
  const [activeId, setActiveId] = useState(orders[0]?.id || "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const markers = orders
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const entering = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (entering[0]) setActiveId(entering[0].target.id);
      },
      {
        root: null,
        rootMargin: "-150px 0px -72% 0px",
        threshold: 0,
      },
    );

    markers.forEach((marker) => sectionObserver.observe(marker));

    return () => sectionObserver.disconnect();
  }, [orders]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;

    const active = nav.querySelector<HTMLElement>(`[data-order-id="${activeId}"]`);
    if (!active) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

    if (mobile) {
      const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
      const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
      nav.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior });
      return;
    }

    const top = active.offsetTop;
    const bottom = top + active.offsetHeight;
    const visibleTop = nav.scrollTop + 8;
    const visibleBottom = nav.scrollTop + nav.clientHeight - 8;

    if (top < visibleTop) {
      nav.scrollTo({ top: Math.max(0, top - 8), behavior });
    } else if (bottom > visibleBottom) {
      nav.scrollTo({ top: bottom - nav.clientHeight + 8, behavior });
    }
  }, [activeId]);

  return (
    <nav ref={navRef} className="bird-order-index" aria-label="Bird order index">
      {orders.map((item) => {
        const active = activeId === item.id;
        return (
          <a
            href={`#${item.id}`}
            data-order-id={item.id}
            className={active ? "active" : undefined}
            aria-current={active ? "location" : undefined}
            aria-label={`${item.labelEn} / ${item.labelKo}, ${item.count} species (${item.order})`}
            title={item.order}
            key={item.id}
            onClick={() => setActiveId(item.id)}
          >
            <span className="bird-order-label">
              <span className="bird-order-label-en">{item.labelEn}</span>
              <span className="bird-order-label-ko ko-font" lang="ko">{item.labelKo}</span>
            </span>
            <small>{item.count}</small>
          </a>
        );
      })}
    </nav>
  );
}
