import type { CSSProperties } from "react";
import { ArrowRightIcon } from "@/components/icons";
import type { PromoTile } from "@/types";

interface InspirationTipsCardProps {
  title: string;
  items: PromoTile[];
  cta?: { label: string; href: string };
}

export function InspirationTipsCard({
  title,
  items,
  cta,
}: InspirationTipsCardProps) {
  return (
    <section className="pub-inspiration-card is-standard">
      <h2>{title}</h2>
      <div className="i-scrollbar">
        <div className="i-scrollbar__wrap i-scrollbar__wrap--hidden-default">
          <div className="i-scrollbar__view">
            <div className="pub-inspiration-card__content">
              {items.map((item) => (
                <div key={item.title} className="pub-inspiration-card__item">
                  <a
                    href={item.ctaHref ?? item.href ?? "#"}
                    className="pub-inspiration-card__link"
                  >
                    <div className="pub-inspiration-card__multi-media">
                      <div
                        className="i-aspect-ratio-box i-aspect-ratio-box--standard i-product-image-box i-tile-media"
                        style={
                          item.backgroundColor
                            ? ({ "--tile-color": item.backgroundColor } as CSSProperties)
                            : undefined
                        }
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="i-object-contain"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    </div>
                    <div
                      className="pub-inspiration-card__desc"
                      style={
                        item.backgroundColor
                          ? {
                              backgroundColor: item.backgroundColor,
                              color: item.textColor ?? "#111111",
                            }
                          : undefined
                      }
                    >
                      <div className="desc-title">
                        <h3>{item.title}</h3>
                        {item.description ? <p>{item.description}</p> : null}
                      </div>
                      {item.ctaLabel ? (
                        <div className="desc-operation">
                          <span className="inspiration-tips-cta">
                            {item.ctaLabel}
                            <ArrowRightIcon width={16} height={16} />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {cta ? (
        <div className="flex justify-center">
          <a
            href={cta.href}
            className="i-btn i-btn--small i-btn--primary mt-4"
          >
            <span className="i-btn__inner">
              <span className="i-btn__label">{cta.label}</span>
            </span>
          </a>
        </div>
      ) : null}
    </section>
  );
}
