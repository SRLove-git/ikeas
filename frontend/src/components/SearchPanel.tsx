"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRightIcon, CloseIcon, SearchIcon } from "@/components/icons"
import { SiteImage } from "@/components/SiteImage"
import type { Category } from "@/data/categories"

interface SearchPanelProps {
  query: string
  searchHints: string[]
  categories: Category[]
  onQueryChange: (value: string) => void
  onSubmit: (value: string) => void
  onClose: () => void
}

export function SearchPanel({
  query,
  searchHints,
  categories,
  onQueryChange,
  onSubmit,
  onClose,
}: SearchPanelProps) {
  const { t } = useTranslation()
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const keyword = query.trim().toLowerCase()
  const suggestions = keyword
    ? searchHints.filter((hint) => hint.toLowerCase().includes(keyword)).slice(0, 6)
    : searchHints.slice(0, 6)
  const matchedCategories = keyword
    ? categories.filter((category) => category.name.toLowerCase().includes(keyword)).slice(0, 4)
    : []
  const hotCategories = categories.slice(0, 6)

  return (
    <div className="header_container_bottom">
      <div className="max-w-page pt-16 pb-10">
        <form
          role="search"
          className="flex items-center gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(query.trim())
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t("search.close")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ikea-muted transition-colors hover:bg-ikea-gray-100 hover:text-ikea-black"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1 border-b border-ikea-gray-200 transition-colors focus-within:border-ikea-blue">
            <input
              autoFocus
              type="text"
              maxLength={36}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={searchHints[0] ?? t("search.placeholder")}
              aria-label={t("search.aria")}
              className="h-12 w-full bg-transparent text-lg font-bold text-ikea-black outline-none placeholder:text-ikea-gray-200"
            />
          </div>
          <button
            type="submit"
            aria-label={t("search.submit")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ikea-blue transition-colors hover:bg-ikea-gray-100"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,360px)]">
          <section>
            <h2 className="text-sm font-bold text-ikea-black">{t("search.suggestions")}</h2>
            <ul className="mt-3 space-y-1">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <Link
                      href={`/zh/search/products?q=${encodeURIComponent(suggestion)}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded px-2 py-2 text-sm text-ikea-muted transition-colors hover:bg-ikea-gray-100 hover:text-ikea-black"
                    >
                      <SearchIcon className="h-4 w-4" />
                      <span>{suggestion}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link
                      href={`/zh/search/products?q=${encodeURIComponent(query.trim())}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded px-2 py-2 text-sm font-bold text-ikea-blue transition-colors hover:bg-ikea-gray-100"
                    >
                      <SearchIcon className="h-4 w-4" />
                      <span>{t("search.viewAllResults", { q: query.trim() })}</span>
                    </Link>
                  </li>
                  {matchedCategories.map((category) => (
                    <li key={category.name}>
                      <Link
                        href={category.url}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 rounded px-2 py-2 text-sm text-ikea-muted transition-colors hover:bg-ikea-gray-100 hover:text-ikea-black"
                      >
                        <span>{category.name}</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-ikea-black">{t("search.categories")}</h2>
            <ul className="mt-3 space-y-1">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={category.url}
                    onClick={onClose}
                    className="flex items-center justify-between gap-3 rounded px-2 py-2 text-sm text-ikea-muted transition-colors hover:bg-ikea-gray-100 hover:text-ikea-black"
                  >
                    <span>{category.name}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-ikea-black">{t("search.hotCategories")}</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {hotCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.url}
                  onClick={onClose}
                  className="group block"
                >
                  <SiteImage
                    src={category.image}
                    alt={category.name}
                    className="aspect-[4/3] w-full bg-ikea-gray-100"
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                  <p className="mt-2 line-clamp-2 text-xs font-bold leading-4 text-ikea-black">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
