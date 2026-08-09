"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import type { Category } from "@/data/categories";

interface MegaMenuProps {
  categories: Category[];
}

function toPath(url: string): string {
  return url.replace(/^https:\/\/www\.ikea\.cn/, "");
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = categories[activeIndex] ?? categories[0];

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
                          <img src={sub.image} alt={sub.name} loading="lazy" />
                        ) : null}
                      </div>
                      <div className="category-box-name">{sub.name}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="nav-header-card-li">
            <div className="card-container__menu hasAdResource">
              <div className="component">
                <div className="pub-columns two-columns">
                  <div className="pub-columns__item">
                    <div className="pub-columns__content">
                      <Link href="/cn/zh/all-products/">
                        <p>BUZUD 产品中心</p>
                      </Link>
                    </div>
                  </div>
                  <div className="pub-columns__item">
                    <div className="pub-columns__content">
                      <Link href="/cn/zh/customer-service/">
                        <p>客户服务</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-container__resource">
              <div className="navigation-advertisements-page">
                <div className="inspiration-cards">
                  <div className="i-carousel i-carousel--only-one-slide">
                    <div className="swiper">
                      <p className="menu-resource-placeholder">健康产品精选</p>
                    </div>
                  </div>
                </div>
                <div className="pub-image">
                  <Link href="/cn/zh/all-products/">
                    <div className="i-aspect-ratio-box i-aspect-ratio-box--standard">
                      <ChevronRightIcon width={24} height={24} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
