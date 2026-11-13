import type { Category } from "@/data/categories"

export interface CategorySection {
  /** 细分名称；分类未配置 subgroup 时为 null（不分节） */
  name: string | null
  categories: Category[]
}

/**
 * Splits one top-level menu group into its second-level sections, keeping the
 * order in which each subgroup first appears in the data file.
 *
 * Kept out of `@/data/categories` so client components can import it without
 * pulling the server-only JSON loader (`node:fs`) into the browser bundle.
 */
export function groupCategorySections(categories: Category[]): CategorySection[] {
  const sections = new Map<string | null, Category[]>()
  for (const category of categories) {
    const name = category.subgroup?.trim() || null
    const bucket = sections.get(name)
    if (bucket) bucket.push(category)
    else sections.set(name, [category])
  }
  return Array.from(sections, ([name, items]) => ({ name, categories: items }))
}
