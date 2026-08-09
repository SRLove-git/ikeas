import type { ServiceColumnCard } from "@/types";

interface ServiceColumnsProps {
  columns: ServiceColumnCard[];
}

export function ServiceColumns({ columns }: ServiceColumnsProps) {
  return (
    <section className="pub-columns three-columns">
      {columns.map((column) => (
        <div key={column.title} className="pub-columns__item">
          <div className="pub-columns__content">
            <div className="pub-image component-wrapper">
              <a href={column.ctaHref ?? "#"}>
                <div className="i-aspect-ratio-box i-aspect-ratio-box--wide">
                  {column.backgroundImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={column.backgroundImage}
                      alt={column.title}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <p>{column.title}</p>
              </a>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
