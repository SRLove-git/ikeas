"use client";

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { RankingCategory } from "@/types";

interface RankingSectionProps {
  sections: RankingCategory[];
}

export function RankingSection({ sections }: RankingSectionProps) {
  const viewRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const el = viewRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="ranking-container">
      <div className="pub-ranking-list">
        <div className="title-container-nova container" />
        <div className="i-scrollbar">
          <div className="i-scrollbar__arrow is-normal is-left">
            <button
              type="button"
              className="i-btn i-btn--small i-btn--icon-primary i-scrollbar-arrow__button"
              onClick={() => scrollBy(-1)}
              aria-label="向左滚动"
            >
              <span className="i-btn__inner">
                <ChevronLeftIcon />
                <span className="i-btn__label">向左滚动</span>
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
                <ChevronRightIcon />
                <span className="i-btn__label">向右滚动</span>
              </span>
            </button>
          </div>
          <div className="i-scrollbar__wrap i-scrollbar__wrap--hidden-default">
            <div ref={viewRef} className="i-scrollbar__view ranking-scroll">
              <div className="pub-ranking-list__content">
                {sections.map((section) => (
                  <div key={section.id} className="pub-ranking-list__item">
                    <div className="ranking-panel">
                      <div className="pub-ranking-item">
                        <div
                          className="pub-ranking-item-header"
                          style={{
                            backgroundColor: section.backgroundColor ?? "#807151",
                          }}
                        >
                          <div className="pub-ranking-item-header-desc">
                            <span className="ranking-label">热销榜</span>
                            <span className="ranking-name">{section.name}</span>
                          </div>
                          <div className="pub-ranking-item-header-nav">
                            <button type="button" aria-label="查看更多">
                              <ChevronRightIcon width={20} height={20} />
                            </button>
                          </div>
                        </div>
                        <div className="pub-ranking-item-product-list">
                          {section.products.map((product, index) => (
                            <div
                              key={`${product.name}-${product.price}-${index}`}
                              className="pub-ranking-item-product"
                            >
                              <div className="pub-ranking-item-product__icon">
                                {product.icon ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={product.icon} alt="" loading="lazy" />
                                ) : null}
                              </div>
                              <div className="pub-ranking-item-product__image">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-contain object-center"
                                  loading="lazy"
                                />
                              </div>
                              <div className="pub-ranking-item-product__info">
                                <span className="pub-ranking-item-product-name">
                                  {product.name}
                                </span>
                                <span className="pub-ranking-item-product-price">
                                  <i>SGD</i>
                                  {product.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="i-scrollbar__bar is-horizontal">
            <div className="i-scrollbar__thumb is-horizontal" />
          </div>
        </div>
      </div>
    </div>
  );
}
