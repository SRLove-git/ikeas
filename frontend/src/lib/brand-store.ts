// 品牌目录（东芝 / 美的）的后台读写。
//
// 这两个品牌的数据与 BUZUD 主商品分离存放：
//   src/data/toshiba/products.json      + products.en.json
//   src/data/midea/products.json        + products.en.json
//
// 后台只允许修改「可运营字段」（名称、价格、划线价、容量、尺寸、能效、主图），
// 型号、slug、分类属于结构性字段，必须走代码评审。

import fs from "node:fs"
import path from "node:path"

export const BRANDS = ["toshiba", "midea"] as const
export type Brand = (typeof BRANDS)[number]

export const BRAND_LABELS: Record<Brand, string> = {
  toshiba: "东芝 Toshiba",
  midea: "美的 Midea",
}

export interface BrandProductDetail {
  images: string[]
  benefits: string[]
  capacity?: string | null
  dimension: string | null
  energy?: string | null
  materials: string[]
  care: string[]
  description: string | null
}

export interface BrandProduct {
  id: string
  slug: string
  model: string
  name: string
  categorySlug: string
  subSlug: string
  price: number | null
  originalPrice: number | null
  image: string | null
  labels?: { text: string; backgroundColor: string | null; textColor: string | null }[]
  sourceFile?: string
  sourceFolder?: string
  note?: string
  detail: BrandProductDetail
}

export type BrandProductExternalSync = (product: BrandProduct) => Promise<void>

const EDITABLE_TEXT = ["name"] as const
const EDITABLE_NUMBER = ["price", "originalPrice"] as const
const EDITABLE_DETAIL_TEXT = ["capacity", "dimension", "energy"] as const

function isBrand(value: string): value is Brand {
  return (BRANDS as readonly string[]).includes(value)
}

function dataRoot(): string {
  const candidates = [
    process.env.CMS_DATA_ROOT?.trim(),
    path.join(process.cwd(), "src", "data"),
    path.join(process.cwd(), "data"),
  ].filter((candidate): candidate is string => Boolean(candidate))
  for (const candidate of candidates) {
    try {
      if (fs.statSync(path.join(candidate, "toshiba", "products.json")).isFile()) {
        return candidate
      }
    } catch {
      // 继续尝试下一个
    }
  }
  throw new Error("找不到品牌数据目录")
}

function fileFor(brand: Brand, locale: "" | "en"): string {
  const name = locale ? `products.${locale}.json` : "products.json"
  return path.join(dataRoot(), brand, name)
}

// 串行写，避免并发保存互相覆盖
let queue: Promise<unknown> = Promise.resolve()
function withLock<T>(task: () => T | Promise<T>): Promise<T> {
  const next = queue.then(task, task)
  queue = next.catch(() => undefined)
  return next
}

function readFile<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T
}

function writeFile(file: string, value: unknown): void {
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 1)}\n`, "utf8")
  fs.renameSync(tmp, file)
}

export function isBrandId(value: string): value is Brand {
  return isBrand(value)
}

export function listBrandProducts(brand: Brand): BrandProduct[] {
  return readFile<BrandProduct[]>(fileFor(brand, ""))
}

export function getBrandProduct(brand: Brand, slug: string): BrandProduct | null {
  return listBrandProducts(brand).find((item) => item.slug === slug) ?? null
}

export interface BrandProductPatch {
  name?: unknown
  price?: unknown
  originalPrice?: unknown
  capacity?: unknown
  dimension?: unknown
  energy?: unknown
  image?: unknown
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toPrice(value: unknown): number | null | undefined {
  if (value === null || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.\-]/g, ""))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * 更新一个品牌商品。同步写入中文源与英文包，保证前台两个语种一致。
 * 返回更新后的中文记录。
 */
export async function updateBrandProduct(
  brand: Brand,
  slug: string,
  patch: BrandProductPatch,
  externalSync?: BrandProductExternalSync,
): Promise<BrandProduct> {
  return withLock(async () => {
    const zhFile = fileFor(brand, "")
    const enFile = fileFor(brand, "en")
    const zh = readFile<BrandProduct[]>(zhFile)
    const en = readFile<BrandProduct[]>(enFile)
    const target = zh.find((item) => item.slug === slug)
    if (!target) throw new Error("商品不存在")

    const name = toText(patch.name)
    if (patch.name !== undefined && !name) throw new Error("商品名称不能为空")

    const price = toPrice(patch.price)
    if (patch.price !== undefined && price === undefined) throw new Error("价格格式不正确")
    if (price !== null && price !== undefined && price < 0) throw new Error("价格不能为负数")

    const originalPrice = toPrice(patch.originalPrice)
    if (patch.originalPrice !== undefined && originalPrice === undefined) {
      throw new Error("划线价格式不正确")
    }
    if (originalPrice !== null && originalPrice !== undefined && originalPrice < 0) {
      throw new Error("划线价不能为负数")
    }

    const image = patch.image === undefined ? undefined : toText(patch.image)
    const originalZh = structuredClone(zh)
    const originalEn = structuredClone(en)

    try {
      if (name) target.name = name
      if (price !== undefined) target.price = price
      if (originalPrice !== undefined) target.originalPrice = originalPrice
      if (image !== undefined) {
        target.image = image
        target.detail.images = image
          ? [image, ...target.detail.images.filter((url) => url !== image)]
          : []
      }
      if (patch.capacity !== undefined) target.detail.capacity = toText(patch.capacity)
      if (patch.dimension !== undefined) target.detail.dimension = toText(patch.dimension)
      if (patch.energy !== undefined) target.detail.energy = toText(patch.energy)

      // 英文包同步同样的数值字段与名称
      const enTarget = en.find((item) => item.slug === slug)
      if (enTarget) {
        if (price !== undefined) enTarget.price = price
        if (originalPrice !== undefined) enTarget.originalPrice = originalPrice
        if (image !== undefined) {
          enTarget.image = target.image
          enTarget.detail.images = target.detail.images
        }
        if (patch.capacity !== undefined) enTarget.detail.capacity = target.detail.capacity
        if (patch.dimension !== undefined) enTarget.detail.dimension = target.detail.dimension
        if (patch.energy !== undefined) enTarget.detail.energy = target.detail.energy
        if (name) enTarget.name = name
      }

      writeFile(zhFile, zh)
      writeFile(enFile, en)
      await externalSync?.(target)
      return target
    } catch (error) {
      writeFile(zhFile, originalZh)
      writeFile(enFile, originalEn)
      throw error
    }
  })
}

export const BRAND_EDITABLE_FIELDS = {
  text: EDITABLE_TEXT,
  number: EDITABLE_NUMBER,
  detailText: EDITABLE_DETAIL_TEXT,
}

// ---------------------------------------------------------------------------
// 新增 / 删除
// ---------------------------------------------------------------------------

export interface BrandCategoryRaw {
  slug: string
  name: string
  nameEn: string
  subs: { slug: string; name: string; nameEn: string }[]
}

export function listBrandCategories(brand: Brand): BrandCategoryRaw[] {
  return readFile<BrandCategoryRaw[]>(path.join(dataRoot(), brand, "categories.json"))
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function uniqueSlug(base: string, taken: Set<string>): string {
  const seed = base || `item-${Date.now()}`
  if (!taken.has(seed)) return seed
  let index = 2
  while (taken.has(`${seed}-${index}`)) index += 1
  return `${seed}-${index}`
}

export interface BrandProductInput extends BrandProductPatch {
  model?: unknown
  categorySlug?: unknown
  subSlug?: unknown
}

/** 新增品牌商品；型号必填且在该品牌内唯一，分类必须存在。 */
export async function createBrandProduct(
  brand: Brand,
  input: BrandProductInput,
  externalSync?: BrandProductExternalSync,
): Promise<BrandProduct> {
  return withLock(async () => {
    const model = toText(input.model)
    if (!model) throw new Error("型号不能为空")
    const name = toText(input.name)
    if (!name) throw new Error("商品名称不能为空")
    const categorySlug = toText(input.categorySlug)
    const subSlug = toText(input.subSlug)
    const categories = listBrandCategories(brand)
    const category = categories.find((item) => item.slug === categorySlug)
    if (!category) throw new Error("请选择有效的品类")
    if (!category.subs.some((item) => item.slug === subSlug)) throw new Error("请选择有效的子类")

    // 新增时价格可留空（null = 待定价），但给了值就必须是合法数字
    const price = input.price === undefined ? null : toPrice(input.price)
    if (price === undefined) throw new Error("价格格式不正确")
    if (price !== null && price < 0) throw new Error("价格不能为负数")
    const originalPrice = input.originalPrice === undefined ? null : toPrice(input.originalPrice)
    if (originalPrice === undefined) throw new Error("划线价格式不正确")
    if (originalPrice !== null && originalPrice < 0) throw new Error("划线价不能为负数")

    const zhFile = fileFor(brand, "")
    const enFile = fileFor(brand, "en")
    const zh = readFile<BrandProduct[]>(zhFile)
    const en = readFile<BrandProduct[]>(enFile)
    const originalZh = structuredClone(zh)
    const originalEn = structuredClone(en)

    const normalized = model.toLowerCase()
    if (zh.some((item) => item.model.toLowerCase() === normalized)) {
      throw new Error(`型号 ${model} 已存在`)
    }

    const slug = uniqueSlug(slugify(model), new Set(zh.map((item) => item.slug)))
    const image = toText(input.image)
    const images = image ? [image] : []
    const specs = {
      capacity: toText(input.capacity),
      dimension: toText(input.dimension),
      energy: toText(input.energy),
    }

    const base = {
      id: `${brand}-${slug}`,
      slug,
      model,
      categorySlug: category.slug,
      subSlug: subSlug as string,
      price: price ?? null,
      originalPrice: originalPrice ?? null,
      image,
    }

    const zhRecord: BrandProduct = {
      ...base,
      name,
      labels: [],
      detail: {
        images,
        benefits: [],
        ...specs,
        materials: [],
        care: [],
        description: `${brand === "toshiba" ? "东芝" : "美的"} ${model}（${name}）。新加坡市场在售机型，价格为含 GST 的建议零售价。`,
      },
    }
    const enRecord: BrandProduct = {
      ...base,
      name,
      labels: [],
      detail: {
        images,
        benefits: [],
        ...specs,
        materials: [],
        care: [],
        description: `${brand === "toshiba" ? "Toshiba" : "Midea"} ${model} — ${name}. Singapore model. Price shown is the recommended retail price incl. GST.`,
      },
    }

    try {
      zh.push(zhRecord)
      en.push(enRecord)
      writeFile(zhFile, zh)
      writeFile(enFile, en)
      await externalSync?.(zhRecord)
      return zhRecord
    } catch (error) {
      writeFile(zhFile, originalZh)
      writeFile(enFile, originalEn)
      throw error
    }
  })
}

/** 删除品牌商品（中英文两份同时移除）。 */
export async function deleteBrandProduct(
  brand: Brand,
  slug: string,
  externalSync?: BrandProductExternalSync,
): Promise<BrandProduct> {
  return withLock(async () => {
    const zhFile = fileFor(brand, "")
    const enFile = fileFor(brand, "en")
    const zh = readFile<BrandProduct[]>(zhFile)
    const en = readFile<BrandProduct[]>(enFile)
    const originalZh = structuredClone(zh)
    const originalEn = structuredClone(en)
    const index = zh.findIndex((item) => item.slug === slug)
    if (index < 0) throw new Error("商品不存在")
    const [removed] = zh.splice(index, 1)
    const nextEn = en.filter((item) => item.slug !== slug)
    try {
      writeFile(zhFile, zh)
      writeFile(enFile, nextEn)
      await externalSync?.(removed)
      return removed
    } catch (error) {
      writeFile(zhFile, originalZh)
      writeFile(enFile, originalEn)
      throw error
    }
  })
}
