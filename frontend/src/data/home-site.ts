import {
  allBrandCommerceProducts,
  mideaCommerceProducts,
  toshibaCommerceProducts,
  type BrandCommerceProduct,
} from "@/data/brand-commerce"
import { mideaCatalog } from "@/data/midea"
import { toshibaCatalog } from "@/data/toshiba"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

/** home-sg.com 首页数据：只包含美的 / 东芝家电，与医疗站目录完全分离。 */
export interface HomeSiteCategoryTile {
  label: string
  href: string
  image: string | null
}

export interface HomeSiteBrand {
  id: "toshiba" | "midea"
  name: string
  tagline: string
  href: string
  image: string | null
  count: number
}

export interface HomeSiteData {
  heroVideos: Array<{ video?: string; poster: string; href: string; alt: string }>
  categories: HomeSiteCategoryTile[]
  brands: HomeSiteBrand[]
  featured: BrandCommerceProduct[]
  totalProducts: number
}

const FEATURED_SLUGS = [
  "toshiba:gr-rf665wia-pgx-22",
  "midea:mdrf632fid46sg",
  "toshiba:tw-t37bzp105mws-wt",
  "midea:ms8plusapbk",
  "toshiba:er-td5000sg-yk",
  "midea:map400gpbpwh",
  "toshiba:af-74cs1trsg-b",
  "midea:mmo-am920mz",
] as const

const TILE_ORDER = ["fridge", "laundry", "kitchen", "kwh", "small", "clean", "air"] as const

function pickImage(products: BrandCommerceProduct[]): string | null {
  return products.find((product) => product.image)?.image ?? null
}

function brandCategories(locale: Locale) {
  return {
    toshiba: toshibaCatalog(locale),
    midea: mideaCatalog(locale),
  }
}

export function homeSiteData(locale: Locale = DEFAULT_LOCALE): HomeSiteData {
  const toshibaProducts = toshibaCommerceProducts(locale)
  const mideaProducts = mideaCommerceProducts(locale)
  const allProducts = allBrandCommerceProducts(locale)
  const catalogs = brandCategories(locale)
  const isZh = locale === "zh-CN"

  const categories: HomeSiteCategoryTile[] = []
  for (const slug of TILE_ORDER) {
    const toshibaCategory = catalogs.toshiba.find((category) => category.slug === slug)
    const mideaCategory = catalogs.midea.find((category) => category.slug === slug)
    const category = toshibaCategory ?? mideaCategory
    if (!category) continue
    const image =
      pickImage(toshibaProducts.filter((product) => product.brandCategorySlug === slug)) ??
      pickImage(mideaProducts.filter((product) => product.brandCategorySlug === slug))
    categories.push({
      label: category.name,
      href: `/zh/${toshibaCategory ? "toshiba" : "midea"}/#${slug}`,
      image,
    })
  }

  const featured: BrandCommerceProduct[] = []
  for (const entry of FEATURED_SLUGS) {
    const [brand, slug] = entry.split(":")
    const product = allProducts.find(
      (candidate) => candidate.brand === brand && candidate.slug === slug,
    )
    if (product) featured.push(product)
  }

  return {
    heroVideos: [
      {
        video: "/videos/toshiba-er-td5000-promo.mp4",
        poster: "/videos/toshiba-er-td5000-cover-v3.png",
        href: "/zh/toshiba/p/er-td5000sg-yk/",
        alt: isZh
          ? "东芝 ER-TD5000 过热水蒸气烤箱宣传视频"
          : "Toshiba ER-TD5000 superheated steam oven",
      },
      {
        video: "/videos/midea-am820c2ra-promo.mp4",
        poster: "/videos/midea-am820c2ra-cover.png",
        href: "/zh/midea/p/am820c2ra/",
        alt: isZh ? "美的 AM820C2RA 微波炉宣传视频" : "Midea AM820C2RA microwave oven",
      },
    ],
    categories,
    brands: [
      {
        id: "toshiba",
        name: "Toshiba",
        tagline: isZh ? "日式匠心，细节见真章" : "Japanese craft, thoughtfully engineered",
        href: "/zh/toshiba/",
        image:
          pickImage(toshibaProducts.filter((product) => product.slug.includes("japandi"))) ??
          pickImage(toshibaProducts),
        count: toshibaProducts.length,
      },
      {
        id: "midea",
        name: "Midea",
        tagline: isZh ? "智慧科技，让家更轻松" : "Smart technology for an easier home",
        href: "/zh/midea/",
        image:
          pickImage(mideaProducts.filter((product) => product.slug === "ms8plusapbk")) ??
          pickImage(mideaProducts),
        count: mideaProducts.length,
      },
    ],
    featured,
    totalProducts: allProducts.length,
  }
}
