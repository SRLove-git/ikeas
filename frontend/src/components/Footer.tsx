"use client"

import { useTranslation } from "react-i18next"
import { ChevronDownIcon } from "@/components/icons"
import { useLocale } from "@/i18n/LanguageProvider"
import type { Locale } from "@/i18n/config"
import type { FooterLinkGroup } from "@/types"
import {
  HOME_URL,
  MEDICAL_URL,
  SITE_SCOPE,
  hrefVisibleInScope,
  type SiteScope,
} from "@/lib/site-scope"

interface FooterProps {
  linkGroups: FooterLinkGroup[]
  featured: {
    title: string
    description: string
    ctaLabel: string
    href: string
  }[]
  socialIcons: { name: string; src: string }[]
  legal: {
    edition: string
    links: { label: string; href?: string }[]
  }
  /** Deployment variant; defaults to the build-time NEXT_PUBLIC_SITE_SCOPE. */
  scope?: SiteScope
}

export function Footer({
  linkGroups,
  featured,
  socialIcons,
  legal,
  scope = SITE_SCOPE,
}: FooterProps) {
  const { t } = useTranslation()
  const { locale, changeLanguage } = useLocale()
  // Product links follow the deployment scope; customer-service and legal
  // links are shared by all three sites.
  const visibleLinkGroups = linkGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => hrefVisibleInScope(link.href, scope)),
    }))
    .filter((group) => group.links.length > 0)
  if (scope === "portal") {
    visibleLinkGroups.push({
      title: t("footer.ourSites"),
      links: [
        { label: t("header.medicalSite"), href: MEDICAL_URL },
        { label: t("header.homeSite"), href: HOME_URL },
      ],
    })
  }
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
                    <a href={card.href} className="i-btn i-btn--fluid i-btn--small i-btn--primary">
                      <span className="i-btn__inner">
                        <span className="i-btn__label">{card.ctaLabel}</span>
                      </span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="nav-footer_linkGroups">
              {visibleLinkGroups.map((group) => (
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
                  onChange={(event) => changeLanguage(event.target.value as Locale)}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en">English</option>
                  <option value="ms">Bahasa Melayu</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
                <ChevronDownIcon width={16} height={16} />
              </div>
            </div>
            <div className="nav-footer-container-other-row">
              <div className="nav-footer-container-other-edition">{legal.edition}</div>
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
  )
}
