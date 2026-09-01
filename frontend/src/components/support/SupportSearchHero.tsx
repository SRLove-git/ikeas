"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { SearchIcon } from "@/components/icons"

interface HotLink {
  href: string
  text: string
}

interface SupportSearchHeroProps {
  title?: string | null
  eyebrow?: string | null
  subtitle?: string | null
  hotLinks: HotLink[]
  placeholder?: string
  faqTexts: string[]
}

export function SupportSearchHero({
  title,
  eyebrow,
  subtitle,
  hotLinks,
  placeholder,
  faqTexts,
}: SupportSearchHeroProps) {
  const { t } = useTranslation()
  const questions = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i + 1 < faqTexts.length; i += 2) {
      const question = faqTexts[i].trim()
      if (question) out.push(question)
    }
    return out
  }, [faqTexts])

  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const suggestions = useMemo(
    () =>
      questions
        .map((question, index) => ({ question, index }))
        .filter((item) => !q || item.question.toLowerCase().includes(q))
        .slice(0, 6),
    [questions, q],
  )

  const goTo = (index: number) => {
    setQuery("")
    setFocused(false)
    inputRef.current?.blur()
    window.location.hash = `faq-${index}`
  }

  const submit = () => {
    if (suggestions.length > 0) {
      goTo(suggestions[Math.min(activeIndex, suggestions.length - 1)].index)
    } else {
      setFocused(false)
      window.location.hash = "faq"
    }
  }

  return (
    <section className="overflow-hidden bg-ikea-blue text-white">
      <div className="relative mx-auto max-w-3xl px-2 py-12 text-center lg:py-16">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
          ) : null}
          {title ? (
            <h2 className="mt-3 text-2xl font-bold leading-9 lg:text-4xl">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80">{subtitle}</p>
          ) : null}

          <div className="relative mt-7">
            <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 text-left shadow-lg">
              <SearchIcon className="h-5 w-5 shrink-0 text-ikea-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 120)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    submit()
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault()
                    setActiveIndex((index) =>
                      Math.min(index + 1, Math.max(suggestions.length - 1, 0)),
                    )
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    setActiveIndex((index) => Math.max(index - 1, 0))
                  } else if (event.key === "Escape") {
                    setFocused(false)
                  }
                }}
                placeholder={placeholder ?? t("support.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-ikea-black outline-none placeholder:text-ikea-muted/60"
              />
              <button
                type="button"
                onClick={submit}
                className="inline-flex h-10 shrink-0 items-center rounded-full bg-ikea-yellow px-5 text-xs font-bold text-ikea-black transition-colors hover:bg-ikea-black hover:text-white"
              >
                {t("support.searchAria")}
              </button>
            </div>

            {focused && q && suggestions.length > 0 ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white text-left shadow-lg ring-1 ring-ikea-gray-200">
                {suggestions.map((item, position) => (
                  <button
                    key={item.index}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      goTo(item.index)
                    }}
                    onMouseEnter={() => setActiveIndex(position)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-sm ${
                      position === activeIndex
                        ? "bg-ikea-gray-100 text-ikea-black"
                        : "text-ikea-muted"
                    }`}
                  >
                    <SearchIcon className="h-4 w-4 shrink-0 text-ikea-blue" />
                    <span className="min-w-0 flex-1 truncate text-left">{item.question}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {focused && q && suggestions.length === 0 ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl bg-white p-5 text-left text-sm text-ikea-muted shadow-lg ring-1 ring-ikea-gray-200">
                {t("support.noFaqPrefix")}
                <Link
                  href="/zh/customer-service/contact-us/"
                  className="mx-1 font-bold text-ikea-blue underline underline-offset-4"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {t("support.contactSupport")}
                </Link>
                {t("support.getHelpSuffix")}
              </div>
            ) : null}
          </div>

          {hotLinks.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-white/70">{t("support.hotServices")}</span>
              {hotLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/40 px-4 py-1.5 text-xs text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
