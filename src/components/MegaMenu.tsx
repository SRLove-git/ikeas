import { ChevronRightIcon } from "@/components/icons";
import Link from "next/link";

export interface MegaMenuCategory {
  name: string;
  subCategories: string[];
}

interface MegaMenuProps {
  categories: MegaMenuCategory[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  return (
    <div className="header_container_bottom">
      <div className="header_container_bottom_content">
        <div className="nav-header-card-container">
          <div className="nav-header-category">
            <div className="nav-header-category-box">
              <div className="main-list">
                <ul className="category-list">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <a
                        href="#"
                        className={category.name === categories[0].name ? "name active" : "name"}
                      >
                        {category.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sub-list">
                <a href="#" className="sub-title">
                  {categories[0].name}
                </a>
                {categories[0].subCategories.map((sub) => (
                  <div key={sub} className="sub-list-li">
                    <a href="#" className="category-box">
                      <div className="img-bg" />
                      <div className="category-box-name">{sub}</div>
                    </a>
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
                      <p>宜家全屋设计</p>
                    </div>
                  </div>
                  <div className="pub-columns__item">
                    <div className="pub-columns__content">
                      <p>宜家对公业务</p>
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
                      <p className="menu-resource-placeholder">家居灵感</p>
                    </div>
                  </div>
                </div>
                <div className="pub-image">
                  <Link href="/cn/zh/ideas/rooms-inspiration/">
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
