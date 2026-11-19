"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Category } from "@/data/categories"
import { groupCategorySections } from "@/lib/menu-sections"

export interface CategoryGroup {
  name: string
  categories: Category[]
}

export function toPath(url: string): string {
  return url.replace(/^https:\/\/www\.ikea\.cn/, "")
}

/**
 * The original storefront navigation used one three-level directory:
 * category group -> category -> products. Keep it as the "All products"
 * entry so the complete catalogue remains discoverable from one place.
 */
export function AllProductsMegaMenu({ groups }: { groups: CategoryGroup[] }) {
  const [activeGroup, setActiveGroup] = useState(0)
  const [activeCategory, setActiveCategory] = useState(0)
  const group = groups[activeGroup] ?? groups[0]
  const active = group?.categories[activeCategory] ?? group?.categories[0]

  return (
    <div className="header_container_bottom">
      <div className="header_container_bottom_content">
        <div className="nav-header-card-container">
          <div className="mega-menu-3col">
            <div className="mega-menu-3col__groups">
              <ul>
                {groups.map((item, index) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      className={`mega-menu-3col__item ${index === activeGroup ? "is-active" : ""}`}
                      onMouseEnter={() => {
                        setActiveGroup(index)
                        setActiveCategory(0)
                      }}
                      onFocus={() => {
                        setActiveGroup(index)
                        setActiveCategory(0)
                      }}
                    >
                      {item.name}
                      <svg
                        viewBox="0 0 24 24"
                        className="mega-menu-3col__chevron"
                        aria-hidden="true"
                      >
                        <path
                          d="m9 6 6 6-6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mega-menu-3col__categories">
              <ul>
                {group?.categories.map((category, index) => (
                  <li key={`${category.name}-${category.url}`}>
                    <Link
                      href={toPath(category.url)}
                      className={`mega-menu-3col__item ${index === activeCategory ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveCategory(index)}
                      onFocus={() => setActiveCategory(index)}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {active ? (
              <div className="mega-menu-3col__products">
                <Link href={toPath(active.url)} className="mega-menu-3col__products-title">
                  {active.name}
                </Link>
                <div className="mega-menu-3col__products-grid">
                  {active.subs.map((sub) => (
                    <Link
                      key={`${sub.name}-${sub.url}`}
                      href={toPath(sub.url)}
                      className="mega-menu-3col__product"
                    >
                      <span className="mega-menu-3col__product-img">
                        {sub.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="i-object-contain"
                            loading="lazy"
                          />
                        ) : null}
                      </span>
                      <span className="mega-menu-3col__product-name">{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MegaMenu({ group }: { group: CategoryGroup }) {
  const { t } = useTranslation()
  const groupedSections = groupCategorySections(group.categories)
  const sections =
    groupedSections.length === 1 && groupedSections[0]?.name === group.name
      ? [{ name: null, categories: groupedSections[0].categories }]
      : groupedSections
  // Only label the sections when the data actually defines subgroups.
  const showSectionTitles = sections.some((section) => section.name !== null)

  return (
    <div className="header_container_bottom">
      <div className="header_container_bottom_content">
        <div className="nav-header-card-container">
          <div className="mega-menu-directory">
            <div className="mega-menu-directory__header">
              <div>
                <p className="mega-menu-directory__eyebrow">{t("megaMenu.eyebrow")}</p>
                <h2 className="mega-menu-directory__title">{group.name}</h2>
              </div>
              <Link href="/zh/all-products/" className="mega-menu-directory__see-all">
                {t("megaMenu.seeAll")}
              </Link>
            </div>
            <div className="mega-menu-directory__sections">
              {sections.map((section, index) => (
                <section
                  key={section.name ?? `section-${index}`}
                  className="mega-menu-directory__section"
                >
                  {showSectionTitles ? (
                    <div className="mega-menu-directory__section-head">
                      <h3 className="mega-menu-directory__section-title">
                        {section.name ?? t("megaMenu.otherSection")}
                      </h3>
                      <span className="mega-menu-directory__section-count">
                        {t("megaMenu.categoryCount", { count: section.categories.length })}
                      </span>
                    </div>
                  ) : null}
                  <div className="mega-menu-directory__grid">
                    {section.categories.map((category) => {
                      const image = category.image ?? category.subs[0]?.image ?? null
                      const productCount = category.subs.length

                      return (
                        <Link
                          key={`${section.name ?? "section"}-${category.name}-${category.url}`}
                          href={toPath(category.url)}
                          className="mega-menu-directory__item"
                        >
                          <span className="mega-menu-directory__thumb">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image}
                                alt={category.name}
                                className="i-object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="mega-menu-directory__fallback" aria-hidden="true">
                                {category.name.slice(0, 1)}
                              </span>
                            )}
                          </span>
                          <span className="mega-menu-directory__content">
                            <span className="mega-menu-directory__name">{category.name}</span>
                            <span className="mega-menu-directory__meta">
                              {t("megaMenu.productCount", { count: productCount })}
                            </span>
                          </span>
                          <span className="mega-menu-directory__arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
