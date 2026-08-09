import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FloatingWidgets } from "@/components/FloatingWidgets";
import { CartDrawer } from "@/components/CartDrawer";
import {
  homepage,
} from "@/data/homepage";
import { getMenuPanels } from "@/data/menu-panels";
import { getMenuCategories } from "@/data/categories";
import { allProducts } from "@/data/products-index";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const {
    footerFeaturedCards,
    footerLinkGroups,
    legalBar,
    navMenuItems,
    searchHints,
    socialIcons,
  } = homepage();
  const menuPanels = getMenuPanels();
  const categories = getMenuCategories();
  const sampleItems = allProducts().slice(0, 3).map((product, index) => ({
    product,
    qty: index + 1,
  }));

  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <Header
            menuItems={navMenuItems}
            searchHints={searchHints}
            menuPanels={menuPanels}
            categories={categories}
          />
          {children}
          <Footer
            linkGroups={footerLinkGroups}
            featured={footerFeaturedCards}
            socialIcons={socialIcons}
            legal={legalBar}
          />
          <FloatingWidgets />
          <CartDrawer sampleItems={sampleItems} />
        </div>
      </div>
    </main>
  );
}
