import { ChevronDownIcon } from "@/components/icons";
import type { FooterLinkGroup } from "@/types";

interface FooterProps {
  linkGroups: FooterLinkGroup[];
  featured: {
    title: string;
    description: string;
    ctaLabel: string;
    href: string;
  }[];
  socialIcons: { name: string; src: string }[];
  legal: {
    edition: string;
    links: { label: string; href?: string }[];
  };
}

export function Footer({
  linkGroups,
  featured,
  socialIcons,
  legal,
}: FooterProps) {
  return (
    <div className="i-layout__footer">
      <div className="nav-footer">
        <div className="nav-footer-container">
          <div className="nav-footer-container-row">
            <div className="nav-footer_featured-links">
              {featured.map((card) => (
                <div key={card.title} className="nav-footer_featured-link">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className="join-btn">
                    <a
                      href={card.href}
                      className="i-btn i-btn--fluid i-btn--small i-btn--primary"
                    >
                      <span className="i-btn__inner">
                        <span className="i-btn__label">{card.ctaLabel}</span>
                      </span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="nav-footer_linkGroups">
              {linkGroups.map((group) => (
                <div key={group.title} className="nav-footer_linkGroup text-left">
                  <h3>{group.title}</h3>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href ?? "#"}>{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="nav-footer-container-other">
            <div className="nav-footer-container-other-row">
              <div className="nav-footer-container-other-share">
                <ul>
                  {socialIcons.map((icon) => (
                    <li key={icon.name}>
                      <a href="#" aria-label={icon.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.src} alt={icon.name} loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lang-selector-container">
                <select className="lang-selector" aria-label="选择语言">
                  <option>中文</option>
                  <option>English</option>
                </select>
                <ChevronDownIcon width={16} height={16} />
              </div>
            </div>
            <div className="nav-footer-container-other-row">
              <div className="nav-footer-container-other-edition">
                {legal.edition}
              </div>
              <div className="nav-footer-container-other-service">
                <ul>
                  {legal.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href ?? "#"}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
