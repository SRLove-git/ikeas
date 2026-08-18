import Link from "next/link"
import type { ReactNode } from "react"
import type { ContentBlock, ContentBlockItem } from "@/data/pages-types"
import { CorporatePicText } from "@/components/CorporatePicText"
import { CorporateTeamTabs } from "@/components/CorporateTeamTabs"
import { SiteImage } from "@/components/SiteImage"
import { SupportFaq } from "@/components/support/SupportFaq"
import {
  ContactBannerBlock,
  QuickServicesBlock,
  SupportAssurancesBlock,
} from "@/components/support/SupportBlocks"
import { SupportSearchHero } from "@/components/support/SupportSearchHero"

function isInternal(href: string) {
  return href.startsWith("/")
}

export function BlockLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  if (isInternal(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  )
}

interface Item {
  image?: string | null
  text?: string
  href?: string
  title?: string
  backgroundColor?: string | null
}

const PLACEHOLDER_TITLES = new Set(["alt for image", "名称"])

function cleanText(text: string | null | undefined): string {
  const entities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    ldquo: "\u201C",
    rdquo: "\u201D",
    lsquo: "\u2018",
    rsquo: "\u2019",
    hellip: "\u2026",
    mdash: "\u2014",
    ndash: "\u2013",
    bull: "\u2022",
    middot: "\u00B7",
    times: "\u00D7",
    divide: "\u00F7",
    raquo: "\u00BB",
    laquo: "\u00AB",
    copy: "\u00A9",
    reg: "\u00AE",
    deg: "\u00B0",
    plusmn: "\u00B1",
    frac12: "\u00BD",
    frac14: "\u00BC",
    frac34: "\u00BE",
    eacute: "\u00E9",
    egrave: "\u00E8",
    uuml: "\u00FC",
    ouml: "\u00F6",
    auml: "\u00E4",
    aring: "\u00E5",
    oslash: "\u00F8",
    ccedil: "\u00E7",
    szlig: "\u00DF",
    euro: "\u20AC",
    pound: "\u00A3",
    yen: "\u00A5",
    cent: "\u00A2",
    scaron: "\u0161",
    Scaron: "\u0160",
    oacute: "\u00F3",
    Oacute: "\u00D3",
    aacute: "\u00E1",
    Aacute: "\u00C1",
    iacute: "\u00ED",
    Iacute: "\u00CD",
    uacute: "\u00FA",
    Uacute: "\u00DA",
    ntilde: "\u00F1",
    Ntilde: "\u00D1",
    agrave: "\u00E0",
    Agrave: "\u00C0",
    acirc: "\u00E2",
    ecirc: "\u00EA",
    icirc: "\u00EE",
    ocirc: "\u00F4",
    ucirc: "\u00FB",
    yacute: "\u00FD",
    Yacute: "\u00DD",
    oelig: "\u0153",
    OElig: "\u0152",
    yuml: "\u00FF",
    Yuml: "\u0178",
    radic: "\u221A",
    zwnj: "\u200C",
    zwj: "\u200D",
    rsaquo: "\u203A",
    lsaquo: "\u2039",
    rarr: "\u2192",
    larr: "\u2190",
    uarr: "\u2191",
    darr: "\u2193",
    harr: "\u2194",
    sdot: "\u22C5",
    infin: "\u221E",
    ne: "\u2260",
    le: "\u2264",
    ge: "\u2265",
    sup2: "\u00B2",
    sup3: "\u00B3",
  }
  return (text ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/<[^>]*$/g, "")
    .replace(/>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanTitle(title: string | null | undefined): string {
  const t = cleanText(title)
  return PLACEHOLDER_TITLES.has(t) ? "" : t
}

/** Pair images/texts/links into card-like items for galleries and lists. */
function pairItems(block: ContentBlock, max = 12): Item[] {
  const items: Item[] = []
  const n = Math.max(block.images.length, block.texts.length, block.links.length)
  for (let i = 0; i < n && items.length < max; i++) {
    const item: Item = {}
    if (block.links[i]) {
      item.href = block.links[i].href
      if (block.links[i].text) item.text = block.links[i].text
    }
    if (block.images[i]) item.image = block.images[i]
    if (!item.text && block.texts[i]) item.text = block.texts[i]
    items.push(item)
  }
  // Fall back to any leftover links/images not aligned by index.
  if (items.length === 0) {
    const all = Math.max(block.images.length, block.links.length)
    for (let i = 0; i < all && items.length < max; i++) {
      const item: Item = {
        image: block.images[i] ?? null,
        href: block.links[i]?.href,
        text: block.links[i]?.text,
      }
      items.push(item)
    }
  }
  return items
}

function HeroBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null
  const text = block.texts[0] ?? null
  const link = block.links[0] ?? null
  return (
    <section className="relative overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={block.title ?? ""}
          className="h-[300px] w-full md:h-[420px] lg:h-[520px]"
          imgClassName="h-full object-cover"
        />
      ) : null}
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        {block.title ? (
          <h1 className="text-2xl font-bold leading-9 lg:text-4xl">{block.title}</h1>
        ) : null}
        {text ? <p className="mt-3 max-w-2xl text-sm leading-6 text-ikea-muted">{text}</p> : null}
        {link?.href ? (
          <div className="mt-6">
            <BlockLink
              href={link.href}
              className="i-btn i-btn--primary inline-flex h-10 items-center px-5 text-xs font-bold text-white"
            >
              {link.text || "了解更多"}
            </BlockLink>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ImageBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null
  const caption = block.texts.find((t) => t.length < 120) ?? block.title
  return (
    <figure className="overflow-hidden bg-ikea-gray-100">
      {image ? <SiteImage src={image} alt={caption ?? ""} className="aspect-[4/3] w-full" /> : null}
      {caption ? (
        <figcaption className="px-4 py-3 text-xs text-ikea-muted">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="space-y-3">
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts.map((t, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-6 text-ikea-muted">
          {t}
        </p>
      ))}
      {block.links.length > 0 ? (
        <div className="flex flex-wrap gap-3 pt-1">
          {block.links.slice(0, 3).map((l, i) => (
            <BlockLink
              key={i}
              href={l.href}
              className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
            >
              {l.text || "了解更多"}
            </BlockLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ColumnsBlock({ block }: { block: ContentBlock }) {
  const columns = block.columns ?? []
  if (columns.length > 0) {
    return (
      <div className="grid gap-10 md:grid-cols-2">
        {columns.map((column, i) => (
          <div key={i} className="flex flex-col">
            {column.heading ? <h3 className="text-lg font-bold">{column.heading}</h3> : null}
            {column.image ? (
              <div className="mt-3 overflow-hidden">
                <SiteImage
                  src={column.image}
                  alt={column.heading ?? ""}
                  className="aspect-[16/9] w-full"
                />
              </div>
            ) : null}
            {column.text ? (
              <p className="mt-3 text-sm leading-6 text-ikea-muted">{column.text}</p>
            ) : null}
            {column.href ? (
              <div className="mt-4">
                <BlockLink
                  href={column.href}
                  className="i-btn i-btn--small i-btn--primary inline-flex h-9 items-center px-5 text-xs font-bold text-white"
                >
                  了解详情
                </BlockLink>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    )
  }
  const items = block.items ?? []
  if (items.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <SiteImage
              src={item.image}
              alt={cleanTitle(item.title)}
              className="aspect-[4/3] w-full"
            />
            {cleanTitle(item.title) ? (
              <p className="mt-2 text-sm font-bold group-hover:underline">
                {cleanTitle(item.title)}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    )
  }
  const n = Math.max(1, Math.min(4, block.texts.length || block.images.length || 2))
  const fallbackColumns = Array.from({ length: n }, (_, i) => ({
    text: block.texts[i] ?? null,
    image: block.images[i] ?? null,
    link: block.links[i] ?? null,
  }))
  return (
    <div
      className={`grid gap-8 ${
        n === 1 ? "grid-cols-1" : n === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
      }`}
    >
      {fallbackColumns.map((col, i) => (
        <div key={i} className="flex flex-col gap-3">
          {col.image ? (
            <SiteImage src={col.image} alt={col.text ?? ""} className="aspect-[4/3] w-full" />
          ) : null}
          {col.text ? <p className="text-sm leading-6 text-ikea-muted">{col.text}</p> : null}
          {col.link?.href ? (
            <BlockLink
              href={col.link.href}
              className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
            >
              {col.link.text || "了解更多"}
            </BlockLink>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function GalleryBlock({ block, index = 0 }: { block: ContentBlock; index?: number }) {
  const items = block.items ?? []
  const hasLongText = block.texts.some((t) => t.length > 80)
  const singleImage = items.filter((i) => i.image).length === 1
  if (block.title && hasLongText && singleImage) {
    const item = items.find((i) => i.image) ?? items[0]
    const imageLeft = index % 2 === 1
    return (
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className={imageLeft ? "md:order-1" : "md:order-2"}>
          {item?.image ? (
            <SiteImage src={item.image} alt={block.title} className="aspect-[4/3] w-full" />
          ) : null}
        </div>
        <div className={imageLeft ? "md:order-2" : "md:order-1"}>
          <h2 className="text-xl font-bold leading-8">{block.title}</h2>
          <p className="mt-3 text-sm leading-7 text-ikea-muted">
            {block.texts.find((t) => t.length > 80) ?? block.texts[0] ?? ""}
          </p>
        </div>
      </section>
    )
  }
  if (items.length > 0) {
    return (
      <div>
        {block.title ? <h2 className="mb-4 text-xl font-bold">{block.title}</h2> : null}
        {block.texts[0] ? (
          <p className="mb-5 max-w-2xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <BlockLink key={i} href={item.href ?? "#"} className="group">
              <SiteImage
                src={item.image}
                alt={cleanTitle(item.title)}
                className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
              />
              {cleanTitle(item.title) ? (
                <p className="mt-2 line-clamp-2 text-sm font-bold group-hover:underline">
                  {cleanTitle(item.title)}
                </p>
              ) : null}
            </BlockLink>
          ))}
        </div>
      </div>
    )
  }
  const paired = pairItems(block)
  if (paired.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {paired.map((item, i) => (
        <div key={i} className="group overflow-hidden bg-ikea-gray-100">
          {item.image ? (
            <SiteImage
              src={item.image}
              alt={item.text ?? ""}
              className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {item.text ? (
            <p className="truncate px-3 py-2 text-xs text-ikea-muted">{item.text}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ProductGridBlock({ block }: { block: ContentBlock }) {
  const raw = block.items ?? []
  const items: (ContentBlockItem | Item)[] = raw.length > 0 ? raw : pairItems(block, 24)
  if (items.length === 0) return null
  return (
    <div>
      {block.title ? <h2 className="mb-5 text-xl font-bold">{block.title}</h2> : null}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <div className="overflow-hidden bg-ikea-gray-100">
              {item.image ? (
                <SiteImage
                  src={item.image}
                  alt={item.title ?? item.text ?? ""}
                  className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="aspect-square w-full" />
              )}
            </div>
            {item.title ? (
              <p className="mt-2 line-clamp-2 text-sm text-ikea-black">{item.title}</p>
            ) : item.text ? (
              <p className="mt-2 line-clamp-2 text-sm text-ikea-black">{item.text}</p>
            ) : null}
            {item.title && item.text ? (
              <p className="mt-0.5 text-sm font-bold">{item.text}</p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  )
}

function ButtonLinkBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0]
  if (!link?.href) return null
  const candidates = block.texts
    .map((t) => cleanText(t))
    .filter((t) => t.length > 0 && t.length < 30 && !/^(\/|https?:|ikea:|[{])/.test(t))
  const label = link.text || candidates.at(-1) || block.title || "了解更多"
  return (
    <div className="flex justify-center">
      <BlockLink
        href={link.href}
        className="i-btn i-btn--primary inline-flex h-10 items-center px-20 text-xs font-bold text-white"
      >
        <span className="i-btn__inner">
          <span className="i-btn__label">{label}</span>
        </span>
      </BlockLink>
    </div>
  )
}

function QuoteBlock({ block }: { block: ContentBlock }) {
  const text = block.texts[0] ?? block.title
  if (!text) return null
  return (
    <blockquote className="border-l-4 border-ikea-yellow pl-6">
      <p className="text-lg font-bold leading-8 lg:text-xl">{text}</p>
      {block.texts[1] ? (
        <cite className="mt-2 block text-sm not-italic text-ikea-muted">{block.texts[1]}</cite>
      ) : null}
    </blockquote>
  )
}

function PageTitleBlock({ block }: { block: ContentBlock }) {
  return (
    <div>
      <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{block.title}</h1>
      {block.texts[0] ? <p className="mt-2 text-sm text-ikea-muted">{block.texts[0]}</p> : null}
    </div>
  )
}

function PageListBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? []
  if (items.length > 0 && items.some((item) => item.image)) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group block">
            <div className="overflow-hidden bg-ikea-gray-100">
              <SiteImage
                src={item.image}
                alt={item.title}
                className="aspect-[16/9] w-full transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-bold leading-5 group-hover:underline">
                {item.title}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0 text-ikea-muted transition-colors group-hover:text-ikea-blue"
              >
                <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
              </svg>
            </div>
          </BlockLink>
        ))}
      </div>
    )
  }
  const paired = pairItems(block)
  if (paired.length === 0) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {paired.map((item, i) => (
        <BlockLink
          key={i}
          href={item.href ?? "#"}
          className="group flex items-center gap-4 border border-ikea-gray-200 p-4 hover:border-ikea-black"
        >
          {item.image ? (
            <SiteImage
              src={item.image}
              alt=""
              className="h-16 w-16 shrink-0"
              imgClassName="h-full object-cover"
            />
          ) : null}
          <div>
            {item.text ? (
              <p className="text-sm font-bold group-hover:underline">{item.text}</p>
            ) : null}
            {block.links[i]?.text && block.links[i].text !== item.text ? (
              <p className="mt-1 text-xs text-ikea-muted">{block.links[i].text}</p>
            ) : null}
          </div>
        </BlockLink>
      ))}
    </div>
  )
}

function VideoLinkBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null
  const link = block.links[0] ?? null
  const text = block.title ?? block.texts[0] ?? null
  return (
    <BlockLink
      href={link?.href ?? "#"}
      className="group relative block overflow-hidden bg-ikea-gray-100"
    >
      {image ? <SiteImage src={image} alt={text ?? ""} className="aspect-video w-full" /> : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6 text-ikea-blue">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      {text ? (
        <p className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-2 text-sm font-bold text-white">
          {text}
        </p>
      ) : null}
    </BlockLink>
  )
}

function BannerBlock({ block }: { block: ContentBlock }) {
  const image = (block.items ?? [])[0]?.image ?? block.images[0] ?? null
  const link = block.links[0] ?? null
  return (
    <section className="relative overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={block.title ?? ""}
          className="h-64 w-full md:h-80"
          imgClassName="h-full object-cover"
        />
      ) : null}
      <div className="max-w-page mx-auto flex flex-col items-start gap-4 px-5 py-10 lg:px-10">
        {block.title ? <h2 className="text-xl font-bold lg:text-2xl">{block.title}</h2> : null}
        {block.texts[0] ? (
          <p className="max-w-xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
        ) : null}
        {link?.href ? (
          <BlockLink
            href={link.href}
            className="i-btn i-btn--primary inline-flex h-10 items-center px-5 text-xs font-bold text-white"
          >
            {link.text || "了解更多"}
          </BlockLink>
        ) : null}
      </div>
    </section>
  )
}

function PillSliderBlock({ block }: { block: ContentBlock }) {
  const raw = block.items ?? []
  const items: (ContentBlockItem | Item)[] = raw.length > 0 ? raw : pairItems(block)
  if (items.length === 0) return null
  return (
    <div>
      {block.title ? <h2 className="mb-5 text-xl font-bold">{block.title}</h2> : null}
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group w-32 shrink-0">
            <div
              className="overflow-hidden rounded-full border-4 border-transparent transition-colors group-hover:border-ikea-blue"
              style={{ backgroundColor: item.backgroundColor ?? "#f5f5f5" }}
            >
              <SiteImage
                src={item.image}
                alt={item.title ?? item.text ?? ""}
                className="aspect-square w-full rounded-full"
              />
            </div>
            {item.title ? (
              <p className="mt-2 text-center text-xs font-bold group-hover:underline">
                {item.title}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  )
}

function RankingBlock({ block }: { block: ContentBlock }) {
  return (
    <section className="bg-ikea-gray-100 px-6 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold lg:text-xl">
          {block.title ?? block.texts[0] ?? "热销榜单"}
        </h2>
        <BlockLink
          href={block.links[0]?.href ?? "/cn/zh/all-products/"}
          className="text-sm font-bold text-ikea-blue hover:underline"
        >
          {block.links[0]?.text || "查看完整榜单"}
        </BlockLink>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {["#1", "#2", "#3", "#4", "#5"].map((rank, i) => (
          <div
            key={rank}
            className="flex aspect-square flex-col items-center justify-center text-white"
            style={{ backgroundColor: ["#5AA58A", "#5097BF", "#D4973B", "#A36C9F", "#B84A4A"][i] }}
          >
            <span className="text-2xl font-bold">{rank}</span>
            <span className="mt-1 text-xs opacity-90">卧室热销</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ImageWithTextBoxBlock({ block }: { block: ContentBlock }) {
  const item = (block.items ?? [])[0]
  const image = item?.image ?? block.images[0] ?? null
  const title = item?.title ?? block.title
  const link = item?.href ?? block.links[0]?.href ?? null
  return (
    <BlockLink href={link ?? "#"} className="group relative block">
      <SiteImage src={image} alt={title ?? ""} className="aspect-[16/9] w-full" />
      <div className="absolute bottom-0 left-0 m-5 max-w-xs bg-white p-4 shadow-md">
        {title ? <h3 className="text-base font-bold group-hover:underline">{title}</h3> : null}
        {item?.text || block.texts[0] ? (
          <p className="mt-1 text-xs leading-5 text-ikea-muted">{item?.text || block.texts[0]}</p>
        ) : null}
      </div>
    </BlockLink>
  )
}

function InspirationCardBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block)
  if (items.length === 0) return null
  return (
    <div>
      {block.title ? <h2 className="mb-5 text-xl font-bold lg:text-2xl">{block.title}</h2> : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <div className="overflow-hidden bg-ikea-gray-100">
              {item.image ? (
                <SiteImage
                  src={item.image}
                  alt={item.text ?? ""}
                  className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
            </div>
            {item.text ? (
              <p className="mt-2 line-clamp-2 text-sm font-bold group-hover:underline">
                {item.text}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  )
}

function ExpandableBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block, 8)
  const rows =
    block.texts.length >= 2 && block.links.length === 0 && block.images.length === 0
      ? Array.from({ length: Math.ceil(block.texts.length / 2) }, (_, i) => ({
          title: block.texts[i * 2],
          body: block.texts[i * 2 + 1] ?? "",
        }))
      : items.length > 0
        ? items.map((item, i) => ({
            title: item.text ?? block.texts[i] ?? `第 ${i + 1} 项`,
            body: "",
          }))
        : block.texts
            .slice(1)
            .map((t, i) => ({ title: block.texts[0] ?? `第 ${i + 1} 项`, body: t }))
  return (
    <div className="divide-y divide-ikea-gray-200 border-y border-ikea-gray-200">
      {rows.map((row, i) => (
        <details key={i} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
            {row.title}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 transition-transform duration-300 group-open:rotate-180"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </summary>
          {row.body ? <p className="mt-3 text-sm leading-6 text-ikea-muted">{row.body}</p> : null}
        </details>
      ))}
    </div>
  )
}

function PillNavBlock({ block }: { block: ContentBlock }) {
  if (block.links.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {block.links.map((l, i) => (
        <BlockLink
          key={i}
          href={l.href}
          className="i-pill i-pill--small inline-flex h-10 items-center border border-ikea-gray-150 px-5 text-sm font-bold text-ikea-black hover:border-ikea-black"
        >
          {l.text || block.texts[i] || "查看"}
        </BlockLink>
      ))}
    </div>
  )
}

function AssurancesBlock({ block }: { block: ContentBlock }) {
  const raw = block.items ?? []
  const items: (ContentBlockItem | Item)[] = raw.length > 0 ? raw : pairItems(block, 4)
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {items.map((item, i) => (
        <BlockLink key={i} href={item.href ?? "#"} className="group">
          <div className="flex flex-col items-center gap-2 text-center">
            {item.image ? (
              <SiteImage
                src={item.image}
                alt=""
                className="h-12 w-12"
                imgClassName="h-full object-contain"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ikea-gray-100 text-ikea-blue">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5zm0 2.1L18 6.8v4.2c0 4.2-2.5 7.6-6 8.9-3.5-1.3-6-4.7-6-8.9V6.8zM11 7h2v6h-2zm0 7h2v2h-2z" />
                </svg>
              </span>
            )}
            <p className="text-xs font-bold group-hover:underline">
              {cleanTitle(item.title) || cleanText(item.text) || block.texts[i] || block.title}
            </p>
          </div>
        </BlockLink>
      ))}
    </div>
  )
}

function PlannerBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0]
  return (
    <section className="flex flex-col items-center gap-4 border border-ikea-gray-200 bg-ikea-gray-100 px-6 py-14 text-center">
      <h2 className="text-xl font-bold">{block.title ?? "规划工具"}</h2>
      {block.texts[0] ? <p className="max-w-xl text-sm text-ikea-muted">{block.texts[0]}</p> : null}
      {link?.href ? (
        <BlockLink
          href={link.href}
          className="i-btn i-btn--emphasised inline-flex h-10 items-center bg-ikea-yellow px-6 text-xs font-bold text-ikea-black"
        >
          {link.text || "开始规划"}
        </BlockLink>
      ) : null}
    </section>
  )
}

function CorporateHeroBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null
  const link = block.links[0] ?? null
  return (
    <section className="relative overflow-hidden bg-ikea-blue text-white">
      {image ? (
        <SiteImage
          src={image}
          alt={block.title ?? ""}
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full object-cover"
        />
      ) : null}
      {image ? <div className="absolute inset-0 bg-black/50" /> : null}
      {!image ? (
        <>
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-24 h-80 w-80 rounded-full bg-white/5" />
        </>
      ) : null}
      <div className="relative flex min-h-[320px] items-center lg:min-h-[440px]">
        <div className="max-w-page mx-auto w-full px-5 py-16 lg:px-10 lg:py-24">
          {block.title ? (
            <h2 className="max-w-3xl text-2xl font-bold leading-9 lg:text-4xl lg:leading-[3rem]">
              {block.title}
            </h2>
          ) : null}
          {block.texts[0] ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">{block.texts[0]}</p>
          ) : null}
          {link?.href ? (
            <div className="mt-7">
              <BlockLink
                href={link.href}
                className="inline-flex h-11 items-center bg-white px-8 text-sm font-bold text-ikea-black transition-colors hover:bg-ikea-gray-100"
              >
                {link.text || "了解更多"}
              </BlockLink>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function CorporateAboutBlock({ block }: { block: ContentBlock }) {
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  const poster = block.images[0] ?? null
  const videoSrc =
    typeof settings.videoSrc === "string" && settings.videoSrc.trim()
      ? settings.videoSrc.trim()
      : ""
  const videoPoster =
    typeof settings.videoPoster === "string" && settings.videoPoster.trim()
      ? settings.videoPoster.trim()
      : poster
  return (
    <section id={sectionId ?? undefined} className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-12">
      {block.title ? (
        <div className="lg:pt-1">
          <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
        </div>
      ) : null}
      <div className="space-y-6">
        {block.texts.length > 0 ? (
          <div className="space-y-3">
            {block.texts.map((t, i) => (
              <p key={i} className="whitespace-pre-line text-sm leading-6 text-ikea-muted">
                {t}
              </p>
            ))}
          </div>
        ) : null}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ikea-gray-100">
          {videoSrc ? (
            <video
              src={videoSrc}
              poster={videoPoster ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              {videoPoster ? (
                <SiteImage
                  src={videoPoster}
                  alt={block.title ?? ""}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ikea-blue shadow-md">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-xs text-white">品牌视频内容待补充</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function CorporateTextBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0] ?? null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {block.texts.map((t, i) => (
            <p key={i} className="max-w-3xl whitespace-pre-line text-sm leading-6 text-ikea-muted">
              {t}
            </p>
          ))}
        </div>
      ) : null}
      {link?.href ? (
        <div className="mt-5">
          <BlockLink
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-bold text-ikea-blue hover:underline"
          >
            {link.text || "了解更多"}
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
            </svg>
          </BlockLink>
        </div>
      ) : null}
    </section>
  )
}

function CorporateStatsBlock({ block }: { block: ContentBlock }) {
  const items = (block.items ?? []) as unknown as Record<string, unknown>[]
  const link = block.links[0] ?? null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts[0] ? (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
      ) : null}
      {link?.href ? (
        <div className="mt-5">
          <BlockLink
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-bold text-ikea-blue hover:underline"
          >
            {link.text || "了解更多"}
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
            </svg>
          </BlockLink>
        </div>
      ) : null}
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {items.map((item, i) => (
          <div key={i}>
            <div className="text-4xl font-bold text-ikea-blue lg:text-5xl">
              {String(item.value ?? "—")}
            </div>
            <div className="mt-2 text-sm leading-6 text-ikea-muted">{String(item.label ?? "")}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CorporateTimelineBlock({ block }: { block: ContentBlock }) {
  const items = (block.items ?? []) as unknown as Record<string, unknown>[]
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      <div className="mt-8 divide-y divide-ikea-gray-200 border-y border-ikea-gray-200">
        {items.map((item, i) => (
          <div key={i} className="py-7 lg:grid lg:grid-cols-[180px_1fr] lg:gap-10">
            <div className="text-xl font-bold text-ikea-blue">{String(item.year ?? "")}</div>
            <div>
              {item.title ? (
                <h3 className="font-bold text-ikea-black">{String(item.title)}</h3>
              ) : null}
              {item.text ? (
                <p className="mt-1 text-sm leading-6 text-ikea-muted">{String(item.text)}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CorporatePolicyBlock({ block }: { block: ContentBlock }) {
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {block.texts.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-6 text-ikea-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ikea-blue" />
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function CorporateTeamBlock({ block }: { block: ContentBlock }) {
  const items = (block.items ?? []) as unknown as Record<string, unknown>[]
  const link = block.links[0] ?? null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  if (items.length === 0) return null
  return (
    <section id={sectionId ?? undefined}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {block.title ? (
            <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
          ) : null}
          {block.texts[0] ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
          ) : null}
        </div>
        {link?.href ? (
          <BlockLink
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-bold text-ikea-blue hover:underline"
          >
            {link.text || "了解更多"}
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
            </svg>
          </BlockLink>
        ) : null}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => {
          const name = String(item.title ?? "姓名待定")
          const position = String(item.text ?? "")
          const image = typeof item.image === "string" && item.image.trim() ? item.image : null
          const href = typeof item.href === "string" && item.href ? item.href : null
          const card = (
            <div className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-ikea-gray-100">
                {image ? (
                  <SiteImage
                    src={image}
                    alt={name}
                    className="h-full w-full"
                    imgClassName="h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-ikea-gray-100">
                    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ikea-gray-150 text-ikea-muted transition-transform duration-300 group-hover:scale-105">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-11 w-11">
                        <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12zm0 2c-3.9 0-7 2-7 4.4V20h14v-1.6c0-2.4-3.1-4.4-7-4.4z" />
                      </svg>
                    </span>
                    <span className="text-xs text-ikea-muted">头像待定</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-ikea-black">{name}</div>
                {position ? <div className="mt-0.5 text-xs text-ikea-muted">{position}</div> : null}
              </div>
            </div>
          )
          return href ? (
            <BlockLink key={i} href={href} className="block">
              {card}
            </BlockLink>
          ) : (
            <div key={i}>{card}</div>
          )
        })}
      </div>
    </section>
  )
}

function CorporateTeamTabsBlock({ block }: { block: ContentBlock }) {
  const raw = (block.items ?? []) as unknown as Record<string, unknown>[]
  const groups = raw
    .map((item) => {
      const membersRaw = Array.isArray(item.members) ? item.members : []
      const members = membersRaw.map((m) => {
        const member = m as Record<string, unknown>
        return {
          name: String(member.name ?? member.title ?? "姓名待定"),
          position: String(member.position ?? member.text ?? ""),
          image: typeof member.image === "string" && member.image.trim() ? member.image : null,
          href: typeof member.href === "string" && member.href ? member.href : null,
        }
      })
      return {
        id: String(item.id ?? ""),
        title: String(item.title ?? ""),
        description: String(item.description ?? ""),
        members,
      }
    })
    .filter((group) => group.id && group.title && group.members.length > 0)
  if (groups.length === 0) return null
  return <CorporateTeamTabs groups={groups} />
}

function CorporatePicTextBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0] ?? null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      <CorporatePicText
        title={block.title ?? ""}
        texts={block.texts}
        linkHref={link?.href ?? undefined}
        linkText={link?.text ?? undefined}
        image={block.images[0] ?? null}
      />
    </section>
  )
}

const CONTACT_ICONS: Record<string, ReactNode> = {
  default: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z" />,
  phone: (
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.2 1.1z" />
  ),
  email: (
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z" />
  ),
  chat: (
    <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-4 9H8v-2h8zm0-3H8V6h8z" />
  ),
  store: (
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  ),
  feedback: (
    <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6zm8 5H6v-2h8z" />
  ),
  partner: (
    <path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM10 4h4v2h-4zm10 15H4v-2h16zm0-5H4v-2h16z" />
  ),
  careers: (
    <path d="M15 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  ),
  report: (
    <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-1 14h2v2h-2zm0-10h2v6h-2z" />
  ),
  fax: (
    <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8zm3-7a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm-1-9H6v4h12z" />
  ),
  document: (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-2-8V3.5L18.5 8z" />
  ),
  arrow: <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />,
}

function ContactIcon({
  name,
  className = "h-6 w-6",
}: {
  name?: string | null
  className?: string
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {CONTACT_ICONS[name ?? ""] ?? CONTACT_ICONS.default}
    </svg>
  )
}

type ContactItem = ContentBlockItem & { rawText?: string | null }

function contactDetail(item: ContactItem): string {
  return item.rawText ?? item.text ?? ""
}

function contactActionLabel(href: string): string {
  if (href.startsWith("tel:")) return "拨打电话"
  if (href.startsWith("mailto:")) return "发送邮件"
  return "查看详情"
}

function ContactChannelsBlock({ block }: { block: ContentBlock }) {
  const items = (block.items ?? []) as ContactItem[]
  if (items.length === 0) return null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  const grid = items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts[0] ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
      ) : null}
      <div className={`mt-6 grid grid-cols-1 gap-5 ${grid}`}>
        {items.map((item, i) => {
          const href = item.href ?? "#"
          return (
            <BlockLink
              key={i}
              href={href}
              className="group flex h-full flex-col border border-ikea-gray-200 bg-white p-6 transition-colors hover:border-ikea-blue hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ikea-blue/10 text-ikea-blue">
                <ContactIcon name={item.icon} />
              </span>
              {item.title ? (
                <h3 className="mt-4 text-sm font-bold leading-5 group-hover:underline">
                  {item.title}
                </h3>
              ) : null}
              {contactDetail(item) ? (
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-ikea-muted">
                  {contactDetail(item)}
                </p>
              ) : null}
              {href !== "#" ? (
                <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-ikea-blue">
                  {contactActionLabel(href)}
                  <ContactIcon name="arrow" className="h-4 w-4" />
                </span>
              ) : null}
            </BlockLink>
          )
        })}
      </div>
    </section>
  )
}

function ContactListBlock({ block }: { block: ContentBlock }) {
  const items = (block.items ?? []) as ContactItem[]
  if (!block.title && !block.texts[0] && items.length === 0) return null
  const settings = (block.settings ?? {}) as Record<string, unknown>
  const sectionId =
    typeof settings.sectionId === "string" && settings.sectionId.trim()
      ? settings.sectionId.trim()
      : null
  return (
    <section id={sectionId ?? undefined}>
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts[0] ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
      ) : null}
      {items.length > 0 ? (
        <div className="mt-6 divide-y divide-ikea-gray-200 border-y border-ikea-gray-200">
          {items.map((item, i) => {
            const href = item.href ?? "#"
            return (
              <BlockLink key={i} href={href} className="group flex items-start gap-4 py-5">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ikea-gray-100 text-ikea-blue">
                  <ContactIcon name={item.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  {item.title ? (
                    <h3 className="text-sm font-bold leading-5 group-hover:underline">
                      {item.title}
                    </h3>
                  ) : null}
                  {contactDetail(item) ? (
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-ikea-muted">
                      {contactDetail(item)}
                    </p>
                  ) : null}
                </div>
                {href !== "#" ? (
                  <ContactIcon
                    name="arrow"
                    className="mt-1 h-4 w-4 shrink-0 text-ikea-muted transition-colors group-hover:text-ikea-blue"
                  />
                ) : null}
              </BlockLink>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function GenericBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? []
  if (items.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <SiteImage src={item.image} alt={item.title} className="aspect-[4/3] w-full" />
            {item.title ? (
              <p className="mt-2 text-sm font-bold group-hover:underline">{item.title}</p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    )
  }
  const image = block.images[0] ?? null
  return (
    <div className="flex flex-col gap-4">
      {block.title ? <h2 className="text-xl font-bold">{block.title}</h2> : null}
      {image ? <SiteImage src={image} alt="" className="aspect-[4/3] w-full" /> : null}
      {block.texts.map((t, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-6 text-ikea-muted">
          {t}
        </p>
      ))}
      {block.links.map((l, i) => (
        <BlockLink
          key={i}
          href={l.href}
          className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
        >
          {l.text || "了解更多"}
        </BlockLink>
      ))}
    </div>
  )
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const cleanedBlocks = blocks.map((block) => ({
    ...block,
    title: cleanTitle(block.title) || null,
    texts: block.texts.map((t) => cleanText(t)).filter(Boolean),
    items: (block.items ?? []).map((item) => ({
      ...item,
      title: cleanTitle(item.title),
      text: cleanText(item.text),
      rawText: item.text,
    })),
  }))
  const supportFaqTexts =
    cleanedBlocks.find(
      (block) => block.type === "support-faq" || block.type === "pub-expandable-area",
    )?.texts ?? []
  const blockSetting = (block: ContentBlock, key: string): string => {
    const value = block.settings?.[key]
    return typeof value === "string" ? value.trim() : ""
  }
  return (
    <div className="space-y-10">
      {cleanedBlocks.map((block, i) => {
        switch (block.type) {
          case "support-search-hero":
            return (
              <SupportSearchHero
                key={i}
                title={block.title}
                eyebrow={block.texts[0] ?? null}
                subtitle={block.texts[1] ?? null}
                hotLinks={block.links}
                placeholder={blockSetting(block, "placeholder") || undefined}
                faqTexts={supportFaqTexts}
              />
            )
          case "support-quick-services":
            return <QuickServicesBlock key={i} block={block} />
          case "support-assurances":
            return <SupportAssurancesBlock key={i} block={block} />
          case "support-faq":
            return (
              <SupportFaq
                key={i}
                title={block.title}
                texts={block.texts}
                placeholder={blockSetting(block, "placeholder") || undefined}
                sectionId={blockSetting(block, "sectionId") || undefined}
              />
            )
          case "support-contact-banner":
            return <ContactBannerBlock key={i} block={block} />
          case "pub-hero":
          case "pub-standardised-hero":
            return <HeroBlock key={i} block={block} />
          case "pub-image":
          case "image":
            return <ImageBlock key={i} block={block} />
          case "pub-text":
          case "rich-text":
            return <TextBlock key={i} block={block} />
          case "pub-columns":
            return <ColumnsBlock key={i} block={block} />
          case "pub-curated-gallery":
            return <GalleryBlock key={i} block={block} index={i} />
          case "pub-product-shelf":
          case "pub-product-list":
          case "product-list":
            return <ProductGridBlock key={i} block={block} />
          case "pub-button-link":
            return <ButtonLinkBlock key={i} block={block} />
          case "pub-horizontal-line":
            return <hr key={i} className="border-ikea-gray-200" />
          case "pub-quote":
          case "pub-standardised-quote":
            return <QuoteBlock key={i} block={block} />
          case "pub-page-title":
            return <PageTitleBlock key={i} block={block} />
          case "pub-page-list":
          case "pub-pdf-list":
            return <PageListBlock key={i} block={block} />
          case "pub-video-link":
          case "video":
            return <VideoLinkBlock key={i} block={block} />
          case "pub-banner":
            return <BannerBlock key={i} block={block} />
          case "pub-inspiration-card":
            return <InspirationCardBlock key={i} block={block} />
          case "pub-expandable-area":
            return <ExpandableBlock key={i} block={block} />
          case "pub-visual-pill-slider":
            return <PillSliderBlock key={i} block={block} />
          case "pub-visual-navigation":
          case "anchor-navigation":
            return <PillNavBlock key={i} block={block} />
          case "ranking":
            return <RankingBlock key={i} block={block} />
          case "pub-image-with-text-box":
            return <ImageWithTextBoxBlock key={i} block={block} />
          case "pub-assurances":
            return <AssurancesBlock key={i} block={block} />
          case "pub-planner":
            return <PlannerBlock key={i} block={block} />
          case "corporate-hero":
            return <CorporateHeroBlock key={i} block={block} />
          case "corporate-text":
            return <CorporateTextBlock key={i} block={block} />
          case "corporate-about":
            return <CorporateAboutBlock key={i} block={block} />
          case "corporate-stats":
            return <CorporateStatsBlock key={i} block={block} />
          case "corporate-timeline":
            return <CorporateTimelineBlock key={i} block={block} />
          case "corporate-policy":
            return <CorporatePolicyBlock key={i} block={block} />
          case "corporate-pic-text":
            return <CorporatePicTextBlock key={i} block={block} />
          case "corporate-team":
            return <CorporateTeamBlock key={i} block={block} />
          case "corporate-team-tabs":
            return <CorporateTeamTabsBlock key={i} block={block} />
          case "contact-channels":
            return <ContactChannelsBlock key={i} block={block} />
          case "contact-list":
            return <ContactListBlock key={i} block={block} />
          default:
            return <GenericBlock key={i} block={block} />
        }
      })}
    </div>
  )
}
