"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { Category } from "@/data/categories"

interface MegaMenuProps {
  categories: Category[]
}

interface CategoryGroup {
  name: string
  categories: Category[]
}

function toPath(url: string): string {
  return url.replace(/^https:\/\/www\.ikea\.cn/, "")
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const { t } = useTranslation()
  const groups: CategoryGroup[] = []
  for (const category of categories) {
    const name = category.group?.trim() || t("header.groupOther")
    const group = groups.find((candidate) => candidate.name === name)
    if (group) {
      group.categories.push(category)
    } else {
      groups.push({ name, categories: [category] })
    }
  }

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
                  <li key={category.name}>
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
                    <Link key={sub.name} href={toPath(sub.url)} className="mega-menu-3col__product">
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
