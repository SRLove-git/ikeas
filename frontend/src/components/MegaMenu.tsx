"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { Category } from "@/data/categories"

export interface CategoryGroup {
  name: string
  categories: Category[]
}

export function toPath(url: string): string {
  return url.replace(/^https:\/\/www\.ikea\.cn/, "")
}

export function MegaMenu({ group }: { group: CategoryGroup }) {
  const { t } = useTranslation()
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
            <div className="mega-menu-directory__grid">
              {group.categories.map((category) => {
                const image = category.image ?? category.subs[0]?.image ?? null
                const productCount = category.subs.length

                return (
                  <Link
                    key={category.name}
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
          </div>
        </div>
      </div>
    </div>
  )
}
