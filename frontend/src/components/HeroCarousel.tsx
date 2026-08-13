"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/types";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % slides.length) + slides.length) % slides.length);
      setProgress(0);
    },
    [slides.length],
  );

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(current + 100 / 45, 100));
    }, 100);
    intervalRef.current = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
      setProgress(0);
    }, 4500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  return (
    <div className="hero-carousel">
      <div className="i-carousel i-carousel__navigation">
        <div className="swiper">
          <div
            className="swiper-wrapper"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <a
                key={slide.id}
                href={slide.href ?? "#"}
                className={`swiper-slide carousel-gallery__item ${
                  index === active ? "swiper-slide-active" : ""
                }`}
              >
                <div className="hero-carousel__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image.replace(/\.jpg$/, "@2x.jpg")}
                    alt={slide.alt ?? slide.imageAlt ?? ""}
                  />
                </div>
              </a>
            ))}
          </div>
          <div className="swiper-scrollbar">
            <div
              className="swiper-scrollbar-drag"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="swiper-pagination swiper-pagination-bullets">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`切换到第 ${index + 1} 张`}
                className={`swiper-pagination-bullet ${
                  index === active ? "swiper-pagination-bullet-active" : ""
                }`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
