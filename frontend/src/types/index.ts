export interface NoticeItem {
  text: string
  href?: string
}

export interface HeaderAction {
  label: string
  icon: "search" | "user" | "heart" | "cart"
  href?: string
}

export interface HeroVideo {
  video?: string | null
  poster: string
  href?: string
  alt?: string
}

export interface PromoTile {
  eyebrow?: string
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  badge?: string
  image?: string
  backgroundColor?: string
  textColor?: string
  href?: string
}

export interface ServiceColumnCard {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  backgroundImage?: string
}

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

export interface RankingProduct {
  name: string
  price: string
  originalPrice?: string
  image: string
  icon?: string
  badge?: string
  href?: string
}

export interface RankingCategory {
  id: string
  name: string
  backgroundColor?: string
  products: RankingProduct[]
}

export interface PillSliderItem {
  label: string
  image?: string
  href?: string
}

export interface InspirationCardItem {
  eyebrow?: string
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  image?: string
  badge?: string
  theme?: "yellow" | "blue" | "red" | "beige" | "white"
}

export type ProductTagType = "new" | "hot" | "discontinued" | "customize" | "lowest"

export interface ProductCard {
  name: string
  price: string
  originalPrice?: string
  image: string
  tag?: string
  tagType?: ProductTagType
  href?: string
}

export interface AssuranceItem {
  icon: "truck" | "assembly" | "design" | "installation"
  title: string
  description: string
  ctaLabel: string
  ctaHref?: string
}

export interface FooterLinkGroup {
  title: string
  links: { label: string; href?: string }[]
}

export interface FooterFeaturedCard {
  eyebrow: string
  title: string
  description: string
  links: { label: string; href?: string }[]
  image?: string
}

export interface CategoryNode {
  name: string
  href?: string
  children?: CategoryNode[]
  image?: string
}
