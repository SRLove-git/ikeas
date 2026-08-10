// CMS-managed content. The admin panel writes src/data/menu-categories.json;
// this module reads the latest file on every render. (Content is maintained
// as BUZUD categories under frontend/src/data/menu-categories.json.)

import { loadDataJson } from "@/lib/data-files"

export interface CategorySub {
  name: string
  url: string
  image: string | null
}

export interface Category {
  name: string
  url: string
  image: string | null
  subs: CategorySub[]
}

export function getMenuCategories(): Category[] {
  const data = loadDataJson<{ categories: Category[] }>("menu-categories.json")
  return data.categories
}
