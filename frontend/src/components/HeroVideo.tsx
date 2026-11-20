"use client"

import { useEffect, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { HeroVideo } from "@/types"

interface HeroVideoProps {
  items: HeroVideo[]
  compact?: boolean
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

export function HeroVideo({ items, compact = false }: HeroVideoProps) {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const [activeVideo, setActiveVideo] = useState<number | null>(null)
  const [videoStatus, setVideoStatus] = useState<Record<number, "ready" | "failed">>({})
  const fallbackAlt = t("home.promoVideoAria")

  const startVideo = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    const host = event.currentTarget.parentElement
    const video = host?.querySelector("video")
    if (!video) return

    setActiveVideo(index)
    video.muted = false
    void video.play().catch(() => {
      // Some browsers reject audio playback even after a direct click. Keep the
      // controls visible and fall back to muted playback instead of doing nothing.
      video.muted = true
      void video.play().catch(() => undefined)
    })
  }

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
          const videoAvailable = Boolean(video)
          const hoverPlayable = videoAvailable && !isMobile
          const manuallyPlaying = activeVideo === index
          const videoFailed = videoStatus[index] === "failed"

          return (
            <div
              key={`${href ?? "hero"}-${index}`}
              className={`group relative overflow-hidden rounded-xl bg-ikea-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-lg ${
                compact ? "aspect-video md:aspect-[16/7]" : "aspect-video"
              }`}
              onMouseEnter={(event) => {
                if (!manuallyPlaying) playVideo(event.currentTarget)
              }}
              onMouseLeave={(event) => {
                if (!manuallyPlaying) stopVideo(event.currentTarget)
              }}
              onFocus={(event) => {
                if (!manuallyPlaying && !isMobile) playVideo(event.currentTarget)
              }}
              onBlur={(event) => {
                if (!manuallyPlaying) stopVideo(event.currentTarget)
              }}
            >
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterSrc ?? undefined}
                  alt={alt ?? fallbackAlt}
                  className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
                    compact ? "object-contain" : "object-cover"
                  } ${
                    manuallyPlaying
                      ? "opacity-0"
                      : hoverPlayable && !videoFailed
                        ? "group-hover:opacity-0 group-focus-within:opacity-0"
                        : ""
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
              {videoAvailable ? (
                <video
                  className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 ${
                    manuallyPlaying
                      ? "pointer-events-auto z-20 opacity-100"
                      : hoverPlayable && !videoFailed
                        ? "pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100"
                        : "pointer-events-none"
                  } ${compact ? "object-contain" : "object-cover"}`}
                  src={video ?? undefined}
                  poster={posterSrc ?? undefined}
                  muted={!manuallyPlaying}
                  loop={!manuallyPlaying}
                  controls={manuallyPlaying}
                  playsInline
                  preload="metadata"
                  aria-label={alt ?? fallbackAlt}
                  onCanPlay={() =>
                    setVideoStatus((current) =>
                      current[index] === "ready" ? current : { ...current, [index]: "ready" },
                    )
                  }
                  onError={() => {
                    setActiveVideo((active) => (active === index ? null : active))
                    setVideoStatus((current) =>
                      current[index] === "failed" ? current : { ...current, [index]: "failed" },
                    )
                  }}
                  onEnded={() => setActiveVideo((active) => (active === index ? null : active))}
                />
              ) : null}
              {videoAvailable && !videoFailed && !manuallyPlaying ? (
                <button
                  type="button"
                  aria-label={`${t("home.playVideo")}: ${alt ?? fallbackAlt}`}
                  className="absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ikea-blue"
                  onClick={(event) => startVideo(event, index)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
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
