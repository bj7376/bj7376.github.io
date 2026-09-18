"use client";

import { useEffect, useState } from "react";

export type BirdOrderIndexItem = {
  id: string;
  order: string;
  label: string;
  count: number;
};

export function BirdOrderIndex({ orders }: { orders: BirdOrderIndexItem[] }) {
  const [activeId, setActiveId] = useState(orders[0]?.id || "");

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
        rootMargin: "-64px 0px -80% 0px",
        threshold: 0,
      },
    );

    markers.forEach((marker) => sectionObserver.observe(marker));

    const sentinel = document.getElementById("bird-order-index-sentinel");
    const stickyObserver = sentinel
      ? new IntersectionObserver(
          ([entry]) => {
            const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            document.documentElement.classList.toggle("birding-order-index-stuck", stuck);
          },
          { threshold: 0 },
        )
      : null;

    if (sentinel && stickyObserver) stickyObserver.observe(sentinel);

    return () => {
      sectionObserver.disconnect();
      stickyObserver?.disconnect();
      document.documentElement.classList.remove("birding-order-index-stuck");
    };
  }, [orders]);

  return (
    <>
      <div id="bird-order-index-sentinel" className="bird-order-index-sentinel" aria-hidden="true" />
      <nav className="bird-order-index" aria-label="Bird order index">
        {orders.map((item) => {
          const active = activeId === item.id;
          return (
            <a
              href={`#${item.id}`}
              className={active ? "active" : undefined}
              aria-current={active ? "location" : undefined}
              aria-label={`${item.label}, ${item.count} species (${item.order})`}
              title={item.order}
              key={item.id}
              onClick={() => setActiveId(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.count}</small>
            </a>
          );
        })}
      </nav>
    </>
  );
}
