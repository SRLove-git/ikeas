// CMS-managed content. The admin panel writes src/data/homepage.json; this
// module reads the latest file on every render so content edits take effect
// immediately (no rebuild or restart needed).

import type {
  AssuranceItem,
  FooterLinkGroup,
  HeroVideo,
  NoticeArticle,
  PillSliderItem,
  PromoTile,
  RankingCategory,
  ServiceColumnCard,
} from "@/types"
import { loadDataJson } from "@/lib/data-files"

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

export interface HomepageData {
  noticeMessages: { text: string; href: string }[]
  searchHints: string[]
  navMenuItems: { label: string; href: string; hasMegaMenu?: boolean }[]
  megaMenuCategories: { name: string; subCategories: string[] }[]
  heroVideo: HeroVideo
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
  recallNotices: (NoticeArticle & { image: string })[]
  footerLinkGroups: FooterLinkGroup[]
  footerFeaturedCards: { title: string; description: string; ctaLabel: string; href: string }[]
  socialIcons: { name: string; src: string }[]
  legalBar: { edition: string; links: { label: string; href: string }[] }
}

export function homepage(): HomepageData {
  return loadDataJson<HomepageData>("homepage.json")
}
