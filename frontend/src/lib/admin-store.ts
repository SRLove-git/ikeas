import fs from "node:fs"
import path from "node:path"
import { loadDataJson, loadDataJsonOptional } from "@/lib/data-files"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

// ---------------------------------------------------------------------------
// File-backed CMS store. Every operation reads/writes the same src/data/*.json
// files the public site renders from, so admin edits take effect immediately.
// ---------------------------------------------------------------------------

const FAMILY_FILES = ["customer-service", "company", "legal", "root"] as const

const PRODUCT_PARTS = ["part-1", "part-2", "part-3", "part-4", "part-5", "part-6"] as const

function dataRoot(): string {
  const candidates = [path.join(process.cwd(), "src", "data"), path.join(process.cwd(), "data")]
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate
    } catch {
      // try next
    }
  }
  throw new Error(`CMS data root not found (searched ${candidates.join(", ")})`)
}

function filePath(rel: string): string {
  const resolved = path.join(dataRoot(), rel)
  const normalized = path.normalize(resolved)
  if (!normalized.startsWith(dataRoot())) {
    throw new Error("Invalid CMS data path")
  }
  return normalized
}

function writeJson(rel: string, value: unknown): void {
  const target = filePath(rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

// Simple in-process write lock so concurrent admin saves never interleave.
let writeQueue: Promise<unknown> = Promise.resolve()
function withWriteLock<T>(fn: () => T): Promise<T> {
  const run = writeQueue.then(fn, fn)
  writeQueue = run.catch(() => undefined)
  return run
}

function nowIso(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface AdminProduct {
  id: string
  slug: string
  name: string
  [key: string]: unknown
}

function loadProductParts(): AdminProduct[][] {
  return PRODUCT_PARTS.map((part) => loadDataJson<AdminProduct[]>(`products/products-${part}.json`))
}

function saveProductParts(parts: AdminProduct[][]): void {
  PRODUCT_PARTS.forEach((part, index) => {
    writeJson(`products/products-${part}.json`, parts[index])
  })
}

export function listProducts(query: string): AdminProduct[] {
  const q = query.trim().toLowerCase()
  const all = loadProductParts().flat()
  if (!q) return all
  return all.filter(
    (product) =>
      product.name?.toLowerCase().includes(q) ||
      product.id?.toLowerCase().includes(q) ||
      product.slug?.toLowerCase().includes(q),
  )
}

export function getProduct(idOrSlug: string): AdminProduct | undefined {
  return loadProductParts()
    .flat()
    .find((product) => product.id === idOrSlug || product.slug === idOrSlug)
}

/** Category names the product belongs to (catalog categories + catalog pages). */
export function productCategories(idOrSlug: string): { name: string; href: string }[] {
  const result: { name: string; href: string }[] = []
  const catalog = loadDataJson<{
    catalogCategories: { slug: string; name: string; products: { id: string; slug: string }[] }[]
    channelCategories: { slug: string; name: string; products: { id: string; slug: string }[] }[]
  }>("catalog.json")
  for (const category of [...catalog.catalogCategories, ...catalog.channelCategories]) {
    if (category.products.some((p) => String(p.id) === idOrSlug || p.slug === idOrSlug)) {
      result.push({ name: category.name, href: `/cn/zh/cat/${category.slug}` })
    }
  }
  const pages =
    loadDataJson<{ name: string; url: string; products: { id: string }[] }[]>(
      "catalog-pages/all.json",
    )
  for (const page of pages) {
    if (page.name && page.products.some((p) => String(p.id) === idOrSlug)) {
      result.push({ name: page.name, href: page.url })
    }
  }
  // A category and its landing page can share the same URL (e.g. /cn/zh/cat/test-kit);
  // dedupe by href so list renders don't collide on React keys.
  const seen = new Set<string>()
  return result.filter((item) => {
    if (seen.has(item.href)) return false
    seen.add(item.href)
    return true
  })
}

export async function upsertProduct(
  input: Record<string, unknown>,
  existingId?: string,
): Promise<AdminProduct> {
  return withWriteLock(() => {
    const parts = loadProductParts()
    const all = parts.flat()
    const product = input as AdminProduct
    if (typeof product.name !== "string" || !product.name.trim()) {
      throw new Error("商品名称不能为空")
    }

    if (existingId) {
      const target = all.find((p) => p.id === existingId)
      if (!target) throw new Error("商品不存在")
      Object.assign(target, product)
      target.id = existingId
      saveProductParts(parts)
      return target
    }
    if (!product.id) product.id = String(Date.now())
    if (!product.slug) {
      product.slug = `${String(product.name).replace(/\s+/g, "-")}-${product.id}`
    }
    const target = product
    parts[parts.length - 1].push(target)
    saveProductParts(parts)
    return target
  })
}

export async function deleteProduct(idOrSlug: string): Promise<boolean> {
  return withWriteLock(() => {
    const parts = loadProductParts()
    let removed = false
    for (const part of parts) {
      const index = part.findIndex((p) => p.id === idOrSlug || p.slug === idOrSlug)
      if (index >= 0) {
        part.splice(index, 1)
        removed = true
      }
    }
    if (removed) saveProductParts(parts)
    return removed
  })
}

// ---------------------------------------------------------------------------
// Content pages
// ---------------------------------------------------------------------------

interface AdminPage {
  url: string
  family: string
  title: string
  source?: "crawled" | "legacy"
  [key: string]: unknown
}

function loadFamilyPages(family: string): AdminPage[] {
  const file = FAMILY_FILES.includes(family as (typeof FAMILY_FILES)[number]) ? family : "root"
  return loadDataJsonOptional<AdminPage[]>(`pages/${file}.json`, [])
}

function legacyPagesForAdmin(): AdminPage[] {
  return []
}

export function listPages(family?: string, query?: string): AdminPage[] {
  const families = family ? [family] : FAMILY_FILES
  const q = query?.trim().toLowerCase()
  const pages = families.flatMap((f) => loadFamilyPages(f))
  const legacy = family
    ? legacyPagesForAdmin().filter((page) => page.family === family)
    : legacyPagesForAdmin()
  // Crawled wins; legacy pages fill the gaps (same semantics as pages-index).
  // Compare against ALL crawled pages, so shadowed legacy entries don't show.
  const allCrawledUrls = new Set(
    FAMILY_FILES.flatMap((f) => loadFamilyPages(f)).map((page) => page.url.replace(/\/+$/, "")),
  )
  const merged = [
    ...pages,
    ...legacy.filter((page) => !allCrawledUrls.has(page.url.replace(/\/+$/, ""))),
  ]
  if (!q) return merged
  return merged.filter(
    (page) =>
      page.title?.toLowerCase().includes(q) ||
      page.url?.toLowerCase().includes(q) ||
      String(page.name ?? "")
        .toLowerCase()
        .includes(q),
  )
}

export function getPage(url: string): AdminPage | undefined {
  const key = url.replace(/\/+$/, "")
  for (const family of FAMILY_FILES) {
    const found = loadFamilyPages(family).find((page) => page.url.replace(/\/+$/, "") === key)
    if (found) return found
  }
  const legacy = legacyPagesForAdmin().find((page) => page.url.replace(/\/+$/, "") === key)
  return legacy
}

export async function upsertPage(
  input: Record<string, unknown>,
  existingUrl?: string,
): Promise<AdminPage> {
  return withWriteLock(() => {
    const page = input as AdminPage
    if (typeof page.url !== "string" || !page.url.trim()) {
      throw new Error("页面 URL 不能为空")
    }
    page.url = page.url.trim()
    if (existingUrl) {
      const oldKey = existingUrl.replace(/\/+$/, "")
      for (const family of FAMILY_FILES) {
        const pages = loadFamilyPages(family)
        const index = pages.findIndex((p) => p.url.replace(/\/+$/, "") === oldKey)
        if (index >= 0) {
          delete (page as Record<string, unknown>).source
          Object.assign(pages[index], page)
          writeJson(`pages/${family}.json`, pages)
          return pages[index]
        }
      }
    }
    delete (page as Record<string, unknown>).source
    const family =
      typeof page.family === "string" && page.family.trim() ? page.family.trim() : "root"
    const pages = loadFamilyPages(family)
    const key = page.url.replace(/\/+$/, "")
    const existing = pages.find((p) => p.url.replace(/\/+$/, "") === key)
    if (existing) {
      Object.assign(existing, page)
      writeJson(`pages/${family}.json`, pages)
      return existing
    }
    pages.push(page)
    writeJson(`pages/${family}.json`, pages)
    return page
  })
}

export async function deletePage(url: string): Promise<boolean> {
  return withWriteLock(() => {
    const key = url.replace(/\/+$/, "")
    for (const family of FAMILY_FILES) {
      const pages = loadFamilyPages(family)
      const index = pages.findIndex((p) => p.url.replace(/\/+$/, "") === key)
      if (index >= 0) {
        pages.splice(index, 1)
        writeJson(`pages/${family}.json`, pages)
        return true
      }
    }
    return false
  })
}

export function pageFamilies(): { name: string; count: number }[] {
  return FAMILY_FILES.map((family) => ({
    name: family,
    count: loadFamilyPages(family).length,
  }))
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export function getHomepage(): Record<string, unknown> {
  return loadDataJson<Record<string, unknown>>("homepage.json")
}

export async function updateHomepage(
  updates: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return withWriteLock(() => {
    const current = getHomepage()
    for (const [key, value] of Object.entries(updates)) {
      if (!(key in current)) {
        throw new Error(`未知的首页字段: ${key}`)
      }
      current[key] = value
    }
    writeJson("homepage.json", current)
    return current
  })
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function getMenu(): Record<string, unknown> {
  return {
    menuPanels: loadDataJson("menu-panels.json"),
    menuCategories: loadDataJson("menu-categories.json"),
  }
}

export async function updateMenu(updates: {
  menuPanels?: unknown
  menuCategories?: unknown
}): Promise<Record<string, unknown>> {
  return withWriteLock(() => {
    if (updates.menuPanels !== undefined) {
      writeJson("menu-panels.json", updates.menuPanels)
    }
    if (updates.menuCategories !== undefined) {
      writeJson("menu-categories.json", updates.menuCategories)
    }
    return getMenu()
  })
}

// ---------------------------------------------------------------------------
// Catalog categories
// ---------------------------------------------------------------------------

export function getCategories(): Record<string, unknown> {
  return loadDataJson("catalog.json") as Record<string, unknown>
}

export async function updateCategories(updates: Record<string, unknown>): Promise<unknown> {
  return withWriteLock(() => {
    const current = getCategories()
    for (const [key, value] of Object.entries(updates)) {
      if (!(key in current)) throw new Error(`未知的分类字段: ${key}`)
      current[key] = value
    }
    writeJson("catalog.json", current)
    return current
  })
}

// ---------------------------------------------------------------------------
// Catalog pages (category landing pages)
// ---------------------------------------------------------------------------

export function listCatalogPages(): Record<string, unknown>[] {
  return loadDataJson<Record<string, unknown>[]>("catalog-pages/all.json")
}

export function getCatalogPage(slug: string): Record<string, unknown> | undefined {
  return listCatalogPages().find(
    (page) =>
      String(page.url ?? "")
        .split("/")
        .filter(Boolean)
        .at(-1) === slug,
  )
}

export async function upsertCatalogPage(
  input: Record<string, unknown>,
  existingSlug?: string,
): Promise<Record<string, unknown>> {
  return withWriteLock(() => {
    const pages = listCatalogPages()
    const target = existingSlug
      ? pages.find(
          (page) =>
            String(page.url ?? "")
              .split("/")
              .filter(Boolean)
              .at(-1) === existingSlug,
        )
      : undefined
    if (existingSlug && !target) throw new Error("落地页不存在")
    if (target) {
      Object.assign(target, input)
    } else {
      pages.push(input)
    }
    writeJson("catalog-pages/all.json", pages)
    return target ?? input
  })
}

export async function deleteCatalogPage(slug: string): Promise<boolean> {
  return withWriteLock(() => {
    const pages = listCatalogPages()
    const index = pages.findIndex(
      (page) =>
        String(page.url ?? "")
          .split("/")
          .filter(Boolean)
          .at(-1) === slug,
    )
    if (index < 0) return false
    pages.splice(index, 1)
    writeJson("catalog-pages/all.json", pages)
    return true
  })
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export function listOrders(): Record<string, unknown>[] {
  return loadDataJson<Record<string, unknown>[]>("orders.json")
}

export function getOrder(id: string): Record<string, unknown> | undefined {
  return listOrders().find((order) => order.id === id)
}

export async function upsertOrder(
  input: Record<string, unknown>,
  existingId?: string,
): Promise<Record<string, unknown>> {
  return withWriteLock(() => {
    const orders = listOrders()
    const target = existingId ? orders.find((order) => order.id === existingId) : undefined
    if (existingId && !target) throw new Error("订单不存在")
    if (target) {
      Object.assign(target, input)
    } else {
      if (!input.id) input.id = String(Date.now())
      input.createdAt = input.createdAt ?? nowIso()
      orders.push(input)
    }
    input.updatedAt = nowIso()
    writeJson("orders.json", orders)
    return target ?? input
  })
}

export async function deleteOrder(id: string): Promise<boolean> {
  return withWriteLock(() => {
    const orders = listOrders()
    const index = orders.findIndex((order) => order.id === id)
    if (index < 0) return false
    orders.splice(index, 1)
    writeJson("orders.json", orders)
    return true
  })
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SiteSettings {
  siteName: string
  siteDescription: string
  adminTitle: string
  siteCopy: {
    notFound: { title: string; body: string; buttonLabel: string }
    survey: { title: string; body: string; buttonLabel: string }
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "CHUNG YIP 健康产品商城 - 家庭健康自测与监测产品",
  siteDescription:
    "CHUNG YIP 健康产品商城，提供快速检测试剂、智能手表、血压计、血糖管理等家庭健康自测与监测产品。",
  adminTitle: "CHUNG YIP 商城内容管理后台",
  siteCopy: {
    notFound: {
      title: "404:哎呀,页面迷路了… 但别担心!",
      body: "我们正在找寻家里的每个角落,但它还在玩捉迷藏。把这次小意外当作探索新事物的机会吧,毕竟,惊喜往往是意想不到的!",
      buttonLabel: "返回首页",
    },
    survey: {
      title: "问卷调查",
      body: "感谢您对 CHUNG YIP 的关注。问卷服务即将上线，敬请期待。",
      buttonLabel: "返回首页",
    },
  },
}

export function getSettings(locale: Locale = DEFAULT_LOCALE): SiteSettings {
  const saved = loadDataJson<Partial<SiteSettings>>("settings.json")
  const base = { ...DEFAULT_SETTINGS, ...saved }
  if (locale !== "en") return base
  const en = loadDataJsonOptional<Partial<SiteSettings>>("settings.en.json", {})
  return { ...base, ...en }
}

export async function updateSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  return withWriteLock(() => {
    const current = getSettings()
    const next = { ...current, ...input }
    writeJson("settings.json", next)
    return next
  })
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

export interface ChangelogEntry {
  id: string
  at: string
  user: string
  action: "create" | "update" | "delete"
  resource: string
  target: string
  summary: string
}

export function listChangelog(): ChangelogEntry[] {
  try {
    return loadDataJson<ChangelogEntry[]>("changelog.json")
  } catch {
    return []
  }
}

export async function appendChangelog(entry: Omit<ChangelogEntry, "id" | "at">): Promise<void> {
  await withWriteLock(() => {
    const entries = listChangelog()
    entries.unshift({
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: nowIso(),
    })
    writeJson("changelog.json", entries.slice(0, 200))
  })
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function siteStats(): Record<string, unknown> {
  const productCount = loadProductParts().flat().length
  const pageCount = FAMILY_FILES.reduce((sum, family) => sum + loadFamilyPages(family).length, 0)
  return {
    products: productCount,
    pages: pageCount,
    pageFamilies: pageFamilies(),
    catalogPages: listCatalogPages().length,
    orders: listOrders().length,
    menuPanels: (getMenu().menuPanels as { menuPanels?: unknown[] })?.menuPanels?.length ?? 0,
    updatedAt: nowIso(),
  }
}
