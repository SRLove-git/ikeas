import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import type { MenuPanel as MenuPanelData } from "@/data/menu-panels";

interface MenuPanelProps {
  panel: MenuPanelData;
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export function MenuPanel({ panel }: MenuPanelProps) {
  return (
    <div className="header_container_bottom">
      <div className="max-w-page mx-auto px-10 py-8">
        <div className="grid grid-cols-1 gap-10">
          {panel.columns.map((column, columnIndex) => {
            return (
              <div key={columnIndex} className="min-w-0">
                {column.heading ? (
                  <h3 className="mb-1 text-base font-bold">{column.heading}</h3>
                ) : null}
                {column.intro ? (
                  <p className="mb-4 text-xs text-ikea-muted">{column.intro}</p>
                ) : null}

                {column.cards.length > 0 ? (
                  <div className="flex gap-5 overflow-x-auto pb-2">
                    {column.cards.map((card, index) => {
                      const content = (
                        <div className="group block w-40 shrink-0">
                          <SiteImage
                            src={card.image}
                            alt={card.title}
                            className="aspect-square w-full"
                          />
                          {card.title ? (
                            <p className="mt-2 text-sm font-bold transition-colors group-hover:text-ikea-blue">
                              {card.title}
                            </p>
                          ) : null}
                        </div>
                      );
                      return isExternal(card.href) ? (
                        <a
                          key={index}
                          href={card.href}
                          target="_blank"
                          rel="noreferrer"
                          className="w-40 shrink-0"
                        >
                          {content}
                        </a>
                      ) : (
                        <Link key={index} href={card.href} className="w-40 shrink-0">
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                {column.thumbnails.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {column.thumbnails.map((item, index) => (
                      <li key={index}>
                        {isExternal(item.href) ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 py-1.5 transition-colors hover:text-ikea-blue"
                          >
                            <SiteImage
                              src={item.image}
                              alt=""
                              className="h-9 w-9 shrink-0"
                            />
                            <span className="text-sm font-bold">{item.title}</span>
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 py-1.5 transition-colors hover:text-ikea-blue"
                          >
                            <SiteImage
                              src={item.image}
                              alt=""
                              className="h-9 w-9 shrink-0"
                            />
                            <span className="text-sm font-bold">{item.title}</span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {column.links.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {column.links.map((link, index) => (
                      <li key={index}>
                        {isExternal(link.href) ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="block py-1.5 text-sm text-ikea-muted transition-colors hover:text-ikea-black"
                          >
                            {link.title}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="block py-1.5 text-sm text-ikea-muted transition-colors hover:text-ikea-black"
                          >
                            {link.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
