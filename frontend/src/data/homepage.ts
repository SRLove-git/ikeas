// CMS-managed content. The admin panel writes src/data/homepage.json; this
// module reads the latest file on every render so content edits take effect
// immediately (no rebuild or restart needed).

import type {
  AssuranceItem,
  FooterLinkGroup,
  HeroVideo,
  PillSliderItem,
  PromoTile,
  RankingCategory,
  ServiceColumnCard,
} from "@/types"
import { loadLocalizedData } from "@/lib/data-files"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

export interface FeedProduct {
  productId?: string
  left: string
  top: string
  href?: string
  tooltipPosition?: string
  title?: string
  desc?: string
  price?: string
  tags: string[]
  tagStyle?: string
  image?: string
}

export interface NavMenuItem {
  label: string
  href: string
  /** 显示「所有商品」分类 Mega 菜单 */
  hasMegaMenu?: boolean
  /** 绑定「导航菜单」中的下拉面板（按面板 label 匹配），留空则不显示面板下拉 */
  menuPanelLabel?: string
}

export interface HomepageData {
  noticeMessages: { text: string; href: string }[]
  searchHints: string[]
  navMenuItems: NavMenuItem[]
  megaMenuCategories: { name: string; subCategories: string[] }[]
  heroVideos: HeroVideo[]
  promoCardItems: PromoTile[]
  inspirationTipsItems: PromoTile[]
  inspirationTipsCta?: { label: string; href: string }
  serviceColumns: ServiceColumnCard[]
  rankingSections: RankingCategory[]
  roomPillItems: PillSliderItem[]
  roomPillCta: { label: string; href: string; color: string; textColor: string }
  sustainabilityPillItems: PillSliderItem[]
  sustainabilityPillCta: { label: string; href: string; color: string; textColor: string }
  feedProducts: Record<string, FeedProduct[]>
  assurances: AssuranceItem[]
  footerLinkGroups: FooterLinkGroup[]
  footerFeaturedCards: { title: string; description: string; ctaLabel: string; href: string }[]
  socialIcons: { name: string; src: string }[]
  legalBar: { edition: string; links: { label: string; href: string }[] }
}

export function homepage(locale: Locale = DEFAULT_LOCALE): HomepageData {
  return loadLocalizedData<HomepageData>("homepage.json", locale)
}
