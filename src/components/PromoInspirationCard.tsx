import { ArrowRightIcon } from "@/components/icons";
import type { PromoTile } from "@/types";

interface PromoInspirationCardProps {
  title: string;
  items: PromoTile[];
}

export function PromoInspirationCard({ title, items }: PromoInspirationCardProps) {
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
                    href={item.href ?? "#"}
                    className="pub-inspiration-card__link"
                  >
                    <div className="pub-inspiration-card__multi-media">
                      <div className="i-aspect-ratio-box i-aspect-ratio-box--square">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.title} loading="lazy" />
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
                      <div className="desc-operation">
                        <button
                          type="button"
                          className={`i-btn i-btn--small ${
                            item.backgroundColor === "#ffdb00"
                              ? "i-btn--icon-primary"
                              : "i-btn--icon-primary-inverse"
                          }`}
                          aria-label={item.title}
                        >
                          <span className="i-btn__inner">
                            <ArrowRightIcon width={20} height={20} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
