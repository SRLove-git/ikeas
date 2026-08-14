"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/types";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [entering, setEntering] = useState<number | null>(null);
  const activeRef = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      const target = ((index % slides.length) + slides.length) % slides.length;
      if (target === activeRef.current) return;
      setPrevious(activeRef.current);
      activeRef.current = target;
      setActive(target);
      setEntering(target);
    },
    [slides.length],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      goTo(activeRef.current + 1);
    }, 5000);
    return () => window.clearInterval(id);
  }, [goTo, slides.length]);

  useEffect(() => {
    if (entering === null) return;
    const id = window.setTimeout(() => setEntering(null), 800);
    return () => window.clearTimeout(id);
  }, [entering]);

  return (
    <section className="prod-intro">
      <div className="prod-products">
        {slides.map((slide, index) => (
          <a
            key={slide.id}
            href={slide.href ?? "#"}
            className={`prod ${index === active ? "active" : ""} ${
              index === previous ? "leaving" : ""
            } ${index === entering ? "entering" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="product"
              src={slide.image}
              alt={slide.alt ?? slide.imageAlt ?? ""}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </a>
        ))}
      </div>
      <div className="prod-intro-pager">
        <div className="pager-bars">
          {slides.map((slide, index) => (
            <span
              key={slide.id}
              className={`pager-bar ${index === active ? "active" : ""}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
