"use client"

import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@/components/icons";
import { useLocale } from "@/i18n/LanguageProvider";
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
  const { t } = useTranslation();
  const { locale, changeLanguage } = useLocale();
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
                <select
                  className="lang-selector"
                  aria-label={t("footer.chooseLanguage")}
                  value={locale}
                  onChange={(event) => changeLanguage(event.target.value as "zh-CN" | "en")}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en">English</option>
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
