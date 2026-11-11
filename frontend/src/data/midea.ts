// Midea 品牌目录（家电产品线）。
//
// 与 BUZUD 健康产品目录分开存放，并通过 brand-commerce 进入统一销售索引：
//   src/data/midea/products.json      商品与价格（中文源）
//   src/data/midea/products.en.json   商品与价格的英文版本
//   src/data/midea/categories.json    品类树（中英名称）
//
// 价格口径：含 GST 的建议零售价（RSP），来源为各型号的上市说明（Launch Memo），
// 每条记录在 sourceFile 中保留出处，便于核对。

import { loadLocalizedData } from "@/lib/data-files"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

export interface MideaProductLabel {
  text: string
  backgroundColor: string | null
  textColor: string | null
}

export interface MideaProductDetail {
  images: string[]
  benefits: string[]
  /** 容量 / Capacity（如 10.5 kg、25 L） */
  capacity?: string | null
  /** 外形尺寸 / Dimensions（W×D×H，mm） */
  dimension: string | null
  /** 能效或水效等级 / Energy or water rating */
  energy?: string | null
  materials: string[]
  care: string[]
  description: string | null
}

export interface MideaProduct {
  id: string
  slug: string
  model: string
  name: string
  categorySlug: string
  subSlug: string
  price: number | null
  originalPrice: number | null
  image: string | null
  labels?: MideaProductLabel[]
  sourceFile?: string
  sourceFolder?: string
  note?: string
  detail: MideaProductDetail
}

interface MideaSubCategoryRaw {
  slug: string
  name: string
  nameEn: string
}

interface MideaCategoryRaw {
  slug: string
  name: string
  nameEn: string
  subs: MideaSubCategoryRaw[]
}

export interface MideaSubCategory {
  slug: string
  name: string
  products: MideaProduct[]
}

export interface MideaCategory {
  slug: string
  name: string
  subs: MideaSubCategory[]
  products: MideaProduct[]
  productCount: number
}

export function allMideaProducts(locale: Locale = DEFAULT_LOCALE): MideaProduct[] {
  return loadLocalizedData<MideaProduct[]>("midea/products.json", locale)
}

export function mideaProductBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): MideaProduct | null {
  return allMideaProducts(locale).find((product) => product.slug === slug) ?? null
}

/** 品类树 + 商品，按 categories.json 的顺序展开；空品类不会返回。 */
export function mideaCatalog(locale: Locale = DEFAULT_LOCALE): MideaCategory[] {
  const raw = loadLocalizedData<MideaCategoryRaw[]>("midea/categories.json", locale)
  const localized = locale !== "zh-CN"
  const products = allMideaProducts(locale)

  return raw
    .map((category) => {
      const subs = category.subs
        .map((sub) => ({
          slug: sub.slug,
          name: localized ? sub.nameEn : sub.name,
          products: products.filter(
            (product) => product.categorySlug === category.slug && product.subSlug === sub.slug,
          ),
        }))
        .filter((sub) => sub.products.length > 0)

      return {
        slug: category.slug,
        name: localized ? category.nameEn : category.name,
        subs,
        products: subs.flatMap((sub) => sub.products),
        productCount: subs.reduce((total, sub) => total + sub.products.length, 0),
      }
    })
    .filter((category) => category.productCount > 0)
}

export function mideaCategoryBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): MideaCategory | null {
  return mideaCatalog(locale).find((category) => category.slug === slug) ?? null
}
