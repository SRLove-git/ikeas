"use client"

import type { ContentBlock } from "@/data/pages-types"
import { useTranslation } from "react-i18next"
import { BlockLink } from "@/components/ContentBlocks"
import { SiteImage } from "@/components/SiteImage"
import { SupportIcon } from "@/components/support/SupportIcons"

export function QuickServicesBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? []
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <BlockLink
          key={index}
          href={item.href ?? "#"}
          className="group flex flex-col items-center gap-3 rounded-lg border border-ikea-gray-200 bg-white px-4 py-7 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-ikea-blue hover:shadow-md"
        >
          <span className="text-ikea-blue">
            <SupportIcon name={item.icon} className="h-12 w-12" />
          </span>
          <span>
            <span className="block text-sm font-bold leading-5 transition-colors group-hover:text-ikea-blue">
              {item.title}
            </span>
            {item.text ? (
              <span className="mt-1 block text-xs leading-5 text-ikea-muted">{item.text}</span>
            ) : null}
          </span>
        </BlockLink>
      ))}
    </div>
  )
}

export function SupportAssurancesBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? []
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ikea-blue/10 text-ikea-blue">
            <SupportIcon name={item.icon} className="h-7 w-7" />
          </span>
          <p className="text-sm font-bold">{item.title}</p>
          <p className="max-w-[220px] text-xs leading-5 text-ikea-muted">{item.text}</p>
        </div>
      ))}
    </div>
  )
}

export function ContactBannerBlock({ block }: { block: ContentBlock }) {
  const { t } = useTranslation()
  const links = block.links ?? []
  const image = block.images[0] ?? null
  return (
    <section className="relative overflow-hidden bg-ikea-blue text-white">
      {image ? (
        <>
          <SiteImage
            src={image}
            alt={block.title ?? t("content.getHelp")}
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/5" />
        </>
      )}
      <div className="relative mx-auto max-w-page px-5 py-16 lg:px-10 lg:py-24">
        <div className="max-w-xl text-left">
          {block.title ? (
            <h2 className="text-2xl font-bold leading-9 lg:text-3xl lg:leading-10">
              {block.title}
            </h2>
          ) : null}
          {block.texts[0] ? (
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/85">{block.texts[0]}</p>
          ) : null}
          {links.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {links.map((link, index) => (
                <BlockLink
                  key={index}
                  href={link.href}
                  className={
                    index === 0
                      ? "inline-flex h-11 items-center bg-ikea-yellow px-8 text-sm font-bold text-ikea-black transition-colors hover:bg-white"
                      : "inline-flex h-11 items-center border border-white/60 px-8 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  }
                >
                  {link.text || t("content.contactUs")}
                </BlockLink>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
