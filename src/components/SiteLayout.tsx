import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FloatingWidgets } from "@/components/FloatingWidgets";
import {
  footerFeaturedCards,
  footerLinkGroups,
  legalBar,
  megaMenuCategories,
  navMenuItems,
  searchHints,
  socialIcons,
} from "@/data/homepage";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <Header
            menuItems={navMenuItems}
            megaMenuCategories={megaMenuCategories}
            searchHints={searchHints}
          />
          {children}
          <Footer
            linkGroups={footerLinkGroups}
            featured={footerFeaturedCards}
            socialIcons={socialIcons}
            legal={legalBar}
          />
          <FloatingWidgets />
        </div>
      </div>
    </main>
  );
}
