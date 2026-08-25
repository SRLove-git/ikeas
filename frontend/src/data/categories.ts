// CMS-managed content. The admin panel writes src/data/menu-categories.json;
// this module reads the latest file on every render. (Content is maintained
// as BUZUD categories under frontend/src/data/menu-categories.json.)

import { loadLocalizedData } from "@/lib/data-files"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

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

export function getMenuCategories(locale: Locale = DEFAULT_LOCALE): Category[] {
  const data = loadLocalizedData<{ categories: Category[] }>("menu-categories.json", locale)
  return data.categories
}
