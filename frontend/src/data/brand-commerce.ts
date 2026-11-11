import type { ProductData } from "@/data/pages-types"
import { allMideaProducts, mideaCatalog, type MideaProduct } from "@/data/midea"
import { allToshibaProducts, toshibaCatalog, type ToshibaProduct } from "@/data/toshiba"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

export type CommerceBrand = "midea" | "toshiba"
export type SourceBrandProduct = MideaProduct | ToshibaProduct

export interface BrandCommerceProduct extends ProductData {
  [key: string]: unknown
  brand: CommerceBrand
  brandCategorySlug: string
  brandSubSlug: string
  model: string
}

const BRAND_NAMES: Record<CommerceBrand, { zh: string; en: string }> = {
  midea: { zh: "美的", en: "Midea" },
  toshiba: { zh: "东芝", en: "Toshiba" },
}

function commerceProductsForBrand(
  brand: CommerceBrand,
  products: SourceBrandProduct[],
  catalog: ReturnType<typeof mideaCatalog> | ReturnType<typeof toshibaCatalog>,
  locale: Locale,
): BrandCommerceProduct[] {
  const brandName = locale === "zh-CN" ? BRAND_NAMES[brand].zh : BRAND_NAMES[brand].en
  const categoryNames = new Map(catalog.map((category) => [category.slug, category.name]))
  const subNames = new Map(
    catalog.flatMap((category) =>
      category.subs.map((sub) => [`${category.slug}/${sub.slug}`, sub.name] as const),
    ),
  )

  return products.map((product) => {
    const categoryName = categoryNames.get(product.categorySlug) ?? product.categorySlug
    const subName = subNames.get(`${product.categorySlug}/${product.subSlug}`) ?? product.subSlug
    const images = product.detail.images.filter((image): image is string => Boolean(image))
    if (product.image && !images.includes(product.image)) images.unshift(product.image)

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      productType: `${brandName} · ${subName}`,
      designText: product.model,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      labels: product.labels ?? [],
      detail: {
        images,
        benefits: product.detail.benefits,
        capacity: product.detail.capacity ?? null,
        dimension: product.detail.dimension,
        energy: product.detail.energy ?? null,
        materials: product.detail.materials,
        care: product.detail.care,
        description: product.detail.description,
      },
      categoryNames: [brandName, categoryName, subName],
      brand,
      brandCategorySlug: product.categorySlug,
      brandSubSlug: product.subSlug,
      model: product.model,
    }
  })
}

export function mideaCommerceProducts(locale: Locale = DEFAULT_LOCALE): BrandCommerceProduct[] {
  return commerceProductsForBrand("midea", allMideaProducts(locale), mideaCatalog(locale), locale)
}

export function toshibaCommerceProducts(locale: Locale = DEFAULT_LOCALE): BrandCommerceProduct[] {
  return commerceProductsForBrand(
    "toshiba",
    allToshibaProducts(locale),
    toshibaCatalog(locale),
    locale,
  )
}

export function allBrandCommerceProducts(locale: Locale = DEFAULT_LOCALE): BrandCommerceProduct[] {
  return [...mideaCommerceProducts(locale), ...toshibaCommerceProducts(locale)]
}

export function toBrandCommerceProduct(
  brand: CommerceBrand,
  product: SourceBrandProduct,
  locale: Locale = "zh-CN",
): BrandCommerceProduct {
  const catalog = brand === "midea" ? mideaCatalog(locale) : toshibaCatalog(locale)
  return commerceProductsForBrand(brand, [product], catalog, locale)[0]
}
