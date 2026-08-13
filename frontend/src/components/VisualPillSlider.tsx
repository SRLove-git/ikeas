"use client";

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { PillSliderItem } from "@/types";

interface CtaTile {
  label: string;
  href: string;
  color: string;
  textColor: string;
}

interface VisualPillSliderProps {
  title: string;
  items: PillSliderItem[];
  cta?: CtaTile;
}

export function VisualPillSlider({ title, items, cta }: VisualPillSliderProps) {
  const viewRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const el = viewRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="pub-visual-pill-slider">
      <div className="visualpillslider-panel-title">
        <h2>{title}</h2>
      </div>
      <div className="i-scrollbar">
        <div className="i-scrollbar__arrow is-normal is-left">
          <button
            type="button"
            className="i-btn i-btn--small i-btn--icon-primary i-scrollbar-arrow__button"
            onClick={() => scrollBy(-1)}
            aria-label="向左滚动"
          >
            <span className="i-btn__inner">
              <ChevronLeftIcon width={24} height={24} />
            </span>
          </button>
        </div>
        <div className="i-scrollbar__arrow is-normal is-right">
          <button
            type="button"
            className="i-btn i-btn--small i-btn--icon-primary i-scrollbar-arrow__button"
            onClick={() => scrollBy(1)}
            aria-label="向右滚动"
          >
            <span className="i-btn__inner">
              <ChevronRightIcon width={24} height={24} />
            </span>
          </button>
        </div>
        <div className="i-scrollbar__wrap i-scrollbar__wrap--hidden-default">
          <div
            ref={viewRef}
            className="i-scrollbar__view visualpillslider-scroll"
          >
            <div className="visualpillslider-content">
              {items.map((item) => (
                <div key={item.label} className="visualpillslider-li">
                  <a href={item.href ?? "#"} className="visualpillslider-item">
                    <div className="visualpillslider-item-image">
                      <div className="i-aspect-ratio-box i-aspect-ratio-box--portrait i-product-image-box i-tile-media">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.label}
                            className="i-object-contain"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="visualpillslider-btn-container">
                        <div className="visualpillslider-btn">
                          <p>{item.label}</p>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
              {cta ? (
                <div className="visualpillslider-li">
                  <a
                    href={cta.href}
                    className="visualpillslider-item visualpillslider-cta"
                    style={{
                      backgroundColor: cta.color,
                      color: cta.textColor,
                    }}
                  >
                    <span className="visualpillslider-cta__label">
                      {cta.label}
                    </span>
                    <span className="visualpillslider-cta__arrow">
                      <ChevronRightIcon width={24} height={24} />
                    </span>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="i-scrollbar__bar is-horizontal">
          <div className="i-scrollbar__thumb is-horizontal" />
        </div>
      </div>
    </section>
  );
}
