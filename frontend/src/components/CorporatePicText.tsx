"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"

interface CorporatePicTextProps {
  title: string
  texts: string[]
  linkHref?: string
  linkText?: string
  image: string | null
}

const COLLAPSED_HEIGHT = 236

/**
 * Huawei-style picture + text panel: image on the left, governance text on
 * the right with a "展开更多 / 收起" toggle when the text overflows.
 */
export function CorporatePicText({
  title,
  texts,
  linkHref,
  linkText,
  image,
}: CorporatePicTextProps) {
  const { t } = useTranslation()
  const textBoxRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      const el = textBoxRef.current
      if (!el) return
      setHasOverflow(el.scrollHeight > COLLAPSED_HEIGHT + 1)
    }
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    if (textBoxRef.current) observer.observe(textBoxRef.current)
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(checkOverflow)
    }
    window.addEventListener("resize", checkOverflow)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", checkOverflow)
    }
  }, [])

  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="overflow-hidden bg-ikea-gray-100">
        <SiteImage
          src={image}
          alt={title}
          className="h-full min-h-[240px] w-full"
          imgClassName="h-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <div
          ref={textBoxRef}
          className={`space-y-3 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            expanded ? "max-h-[1000px]" : "max-h-[236px]"
          }`}
        >
          {texts.map((text, i) => (
            <p key={i} className="text-sm leading-6 text-ikea-muted">
              {text}
            </p>
          ))}
          {linkHref ? (
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1 pt-1 text-sm font-bold text-ikea-blue hover:underline"
            >
              {linkText || t("content.learnMore")}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
              </svg>
            </Link>
          ) : null}
        </div>
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 self-start text-xs font-bold text-ikea-blue"
          >
            {expanded ? t("content.collapse") : t("content.expandMore")}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`h-4 w-4 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  )
}
