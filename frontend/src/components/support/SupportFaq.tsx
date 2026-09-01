"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon, SearchIcon } from "@/components/icons"

interface SupportFaqProps {
  title?: string | null
  texts: string[]
  placeholder?: string
  sectionId?: string
}

interface FaqRow {
  question: string
  answer: string
}

function buildRows(texts: string[]): FaqRow[] {
  const rows: FaqRow[] = []
  for (let i = 0; i + 1 < texts.length; i += 2) {
    rows.push({ question: texts[i], answer: texts[i + 1] })
  }
  return rows
}

export function SupportFaq({ title, texts, placeholder, sectionId }: SupportFaqProps) {
  const { t } = useTranslation()
  const rows = useMemo(() => buildRows(texts), [texts])
  const [query, setQuery] = useState("")
  const detailRefs = useRef<(HTMLDetailsElement | null)[]>([])

  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      rows
        .map((row, originalIndex) => ({ row, originalIndex }))
        .filter(
          ({ row }) =>
            !q || row.question.toLowerCase().includes(q) || row.answer.toLowerCase().includes(q),
        ),
    [rows, q],
  )

  const openFromHash = () => {
    const match = /^#faq-(\d+)$/.exec(window.location.hash)
    if (!match) return
    const index = Number(match[1])
    const element = detailRefs.current[index]
    if (!element) return
    element.open = true
    window.setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
  }

  useEffect(() => {
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [rows.length])

  return (
    <section id={sectionId ?? undefined}>
      {title ? <h2 className="text-xl font-bold leading-8 lg:text-2xl">{title}</h2> : null}
      <div className="relative mt-4 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ikea-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder ?? t("support.faqPlaceholder")}
          className="h-11 w-full rounded-full border border-ikea-gray-200 bg-white pl-11 pr-4 text-sm text-ikea-black outline-none placeholder:text-ikea-muted/60 focus:border-ikea-blue"
        />
      </div>

      <div className="mt-6 divide-y divide-ikea-gray-200 border-y border-ikea-gray-200">
        {visible.map(({ row, originalIndex }) => (
          <details
            key={originalIndex}
            id={`faq-${originalIndex}`}
            ref={(element) => {
              detailRefs.current[originalIndex] = element
            }}
            className="group"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold leading-6">
              <span>{row.question}</span>
              <ChevronDownIcon className="h-5 w-5 shrink-0 text-ikea-muted transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="whitespace-pre-line pb-4 text-sm leading-6 text-ikea-muted">
              {row.answer}
            </p>
          </details>
        ))}
      </div>

      {q && visible.length === 0 ? (
        <div className="mt-6 rounded-lg bg-ikea-gray-100 p-6 text-center">
          <p className="text-sm text-ikea-muted">{t("support.faqNotFound")}</p>
          <Link
            href="/zh/customer-service/contact-us/"
            className="mt-4 inline-flex h-10 items-center bg-ikea-blue px-6 text-xs font-bold text-white transition-colors hover:bg-ikea-black"
          >
            {t("support.contactSupport")}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
