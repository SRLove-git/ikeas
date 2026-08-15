"use client"

import { useState } from "react"
import Link from "next/link"
import type { Category } from "@/data/categories"

interface MegaMenuProps {
  categories: Category[]
}

function toPath(url: string): string {
  return url.replace(/^https:\/\/www\.ikea\.cn/, "")
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = categories[activeIndex] ?? categories[0]

  return (
    <div className="header_container_bottom">
      <div className="header_container_bottom_content">
        <div className="nav-header-card-container">
          <div className="nav-header-category">
            <div className="nav-header-category-box">
              <div className="main-list">
                <ul className="category-list">
                  {categories.map((category, index) => (
                    <li key={category.name}>
                      <Link
                        href={toPath(category.url)}
                        className={index === activeIndex ? "name active" : "name"}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sub-list">
                <Link href={toPath(active.url)} className="sub-title">
                  {active.name}
                </Link>
                {active.subs.map((sub) => (
                  <div key={sub.name} className="sub-list-li">
                    <Link href={toPath(sub.url)} className="category-box">
                      <div className="img-bg">
                        {sub.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="i-object-contain"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="category-box-name">{sub.name}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
