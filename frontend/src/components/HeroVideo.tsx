"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

interface HeroVideoProps {
  video?: string | null
  poster?: string | null
  href?: string | null
  alt?: string | null
}

export function HeroVideo({ video, poster, href, alt }: HeroVideoProps) {
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

  // 手机端先显示压缩封面，不自动下载整段视频，提升首屏速度
  const media = video && !isMobile ? (
    <video
      className="product"
      src={video}
      poster={poster ?? undefined}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      aria-label={alt ?? fallbackAlt}
    />
  ) : poster ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={poster}
      alt={alt ?? fallbackAlt}
      className="product h-full w-full object-contain"
      decoding="async"
    />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-ikea-blue text-white">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-9 w-9" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <p className="text-sm font-bold tracking-[0.3em]">{t("home.videoComingSoon")}</p>
    </div>
  )

  return (
    <section className="prod-intro">
      <div className="prod-products">
        <div className="prod active">
          {href ? (
            <Link href={href} className="block h-full w-full" aria-label={alt ?? fallbackAlt}>
              {media}
            </Link>
          ) : (
            media
          )}
        </div>
      </div>
    </section>
  )
}
