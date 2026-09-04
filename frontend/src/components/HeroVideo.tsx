"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { HeroVideo } from "@/types"

interface HeroVideoProps {
  items: HeroVideo[]
}

const playVideo = (host: HTMLElement) => {
  const video = host.querySelector("video")
  if (video) void video.play().catch(() => undefined)
}

const stopVideo = (host: HTMLElement) => {
  const video = host.querySelector("video")
  if (video) {
    video.pause()
    video.currentTime = 0
  }
}

export function HeroVideo({ items }: HeroVideoProps) {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const fallbackAlt = t("home.promoVideoAria")

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  if (items.length === 0) return null

  return (
    <section className="max-w-page pt-4 md:pt-6">
      <div className={`grid gap-4 md:gap-6 ${items.length > 1 ? "md:grid-cols-2" : ""}`}>
        {items.map((item, index) => {
          const { video, poster, alt, href } = item
          const posterSrc =
            poster && poster.includes("aliyuncs.com") && !poster.includes("x-oss-process")
              ? `${poster}?x-oss-process=image/resize,w_1280,quality,q_82`
              : poster
          // 手机端不自动下载整段视频，只展示封面（点击卡片直接跳转）
          const hoverPlayable = Boolean(video) && !isMobile

          return (
            <div
              key={`${href ?? "hero"}-${index}`}
              className="group relative aspect-video overflow-hidden rounded-xl bg-ikea-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-lg"
              onMouseEnter={(event) => playVideo(event.currentTarget)}
              onMouseLeave={(event) => stopVideo(event.currentTarget)}
              onFocus={(event) => playVideo(event.currentTarget)}
              onBlur={(event) => stopVideo(event.currentTarget)}
            >
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterSrc ?? undefined}
                  alt={alt ?? fallbackAlt}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                    hoverPlayable ? "group-hover:opacity-0 group-focus-within:opacity-0" : ""
                  }`}
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-ikea-blue text-white">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="ml-1 h-9 w-9"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <p className="text-sm font-bold tracking-[0.3em]">{t("home.videoComingSoon")}</p>
                </div>
              )}
              {hoverPlayable ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  src={video ?? undefined}
                  poster={poster ?? undefined}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={alt ?? fallbackAlt}
                />
              ) : null}
              {hoverPlayable ? (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0"
                  aria-hidden="true"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              ) : null}
              {href ? (
                <Link
                  href={href}
                  aria-label={alt ?? fallbackAlt}
                  className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ikea-blue"
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
