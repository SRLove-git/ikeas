"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

interface PortalFlipDeckProps {
  isZh: boolean
}

interface DeckCard {
  src: string
  name: string
  nameZh: string
  world: "medical" | "home"
  widthFactor: number
}

/**
 * The hero showcase is a vertical "wheel" of product sheets: every card sits on
 * an arc around a shared horizontal axis, so the stack rolls (flips) as the page
 * is scrolled, dragged or clicked — the same card-tumble language as the
 * robin-noguier reference, rebuilt with CSS 3D instead of WebGL.
 */
const DECK_CARDS: DeckCard[] = [
  {
    src: "/images/portal/card-wheelchair.png",
    name: "BUZUD pushchair QK805",
    nameZh: "BUZUD 轻便轮椅 QK805",
    world: "medical",
    widthFactor: 1,
  },
  {
    src: "/images/portal/card-oven.png",
    name: "Toshiba 50L built-in oven",
    nameZh: "东芝 50L 嵌入式烤箱",
    world: "home",
    widthFactor: 0.92,
  },
  {
    src: "/images/portal/card-bp.png",
    name: "BUZUD blood pressure monitor 30S",
    nameZh: "BUZUD 血压计 30S",
    world: "medical",
    widthFactor: 0.94,
  },
  {
    src: "/images/portal/card-fridge.png",
    name: "Midea multi-door refrigerator",
    nameZh: "美的多门冰箱",
    world: "home",
    widthFactor: 0.86,
  },
  {
    src: "/images/portal/card-oximeter.png",
    name: "BUZUD fingertip pulse oximeter 70B",
    nameZh: "BUZUD 指夹式血氧仪 70B",
    world: "medical",
    widthFactor: 0.9,
  },
  {
    src: "/images/portal/card-dishwasher.png",
    name: "Toshiba dishwasher",
    nameZh: "东芝洗碗机",
    world: "home",
    widthFactor: 0.88,
  },
]

const TOTAL = DECK_CARDS.length
const STEP_DEG = 26
const SCROLL_PX_PER_CARD = 300
const DRAG_PX_PER_CARD = 190
const EASE = 0.11
const WHEEL_STEP_THRESHOLD = 45
const WHEEL_STEP_LOCK_MS = 240
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

/** Full-page flip mode is owned by PortalMotion (it flags the document). */
function isFlipMode() {
  return document.documentElement.dataset.portalFlip === "true"
}

export function PortalFlipDeck({ isZh }: PortalFlipDeckProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const progressRef = useRef(0)
  const manualRef = useRef(0)
  // Card the deck rests on while the page is in full-page flip mode.
  const stepRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const tiltFrameRef = useRef<number | null>(null)
  const tiltRef = useRef<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ pointerId: number; lastY: number; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)
  const kickRef = useRef<() => void>(() => {})

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    let visible = true
    // Cached so the per-frame render never triggers a layout read.
    let deckHeight = root.clientHeight
    // The hero section pins itself while the deck flips; its scroll range is the
    // deck's timeline. When it is not pinned (mobile / reduced motion) we fall
    // back to a plain "pixels per card" mapping.
    const pinSection = root.closest<HTMLElement>("[data-portal-act]")
    let pinStart = 0
    let pinRange = 0

    const render = (value: number) => {
      const radius = Math.min(700, Math.max(280, deckHeight * 1.05))

      cardRefs.current.forEach((card, index) => {
        if (!card) return

        let offset = index - value
        offset = ((offset % TOTAL) + TOTAL) % TOTAL
        if (offset > TOTAL / 2) offset -= TOTAL

        const angle = offset * STEP_DEG
        const radians = (angle * Math.PI) / 180
        const translateY = Math.sin(radians) * radius
        const translateZ = (Math.cos(radians) - 1) * radius
        const distance = Math.abs(angle)
        const opacity = Math.min(1, Math.max(0, 1.12 - Math.abs(offset) * 0.26))
        const scale = Math.min(1.04, Math.max(0.74, 1.02 - Math.abs(offset) * 0.07))
        const tiltY = index % 2 === 0 ? 6 : -5
        const tiltZ = index % 2 === 0 ? -3.2 : 2.6

        card.style.transform =
          "translate(-50%, -50%) " +
          "perspective(1400px) " +
          "translate3d(0, " +
          translateY.toFixed(2) +
          "px, " +
          translateZ.toFixed(2) +
          "px) " +
          "rotateX(" +
          (-angle).toFixed(2) +
          "deg) " +
          "rotateY(" +
          tiltY +
          "deg) " +
          "rotateZ(" +
          tiltZ +
          "deg) " +
          "scale(" +
          scale.toFixed(3) +
          ")"
        card.style.setProperty("--deck-card-fade", opacity.toFixed(3))
        card.style.visibility = opacity < 0.04 ? "hidden" : "visible"
        card.style.zIndex = String(400 + Math.round(translateZ))
        const stage =
          distance < STEP_DEG * 0.5 ? "active" : distance < STEP_DEG * 1.5 ? "near" : "far"
        card.dataset.stage = stage
        card.tabIndex = stage === "active" ? 0 : -1
        if (stage === "active") card.setAttribute("aria-current", "true")
        else card.removeAttribute("aria-current")
      })
    }

    const tick = () => {
      frameRef.current = null
      if (!visible || reducedMotionQuery.matches) return

      // In full-page flip mode the document does not scroll; wheel/keys below
      // hand one card step at a time to the deck before the page itself flips.
      const target = isFlipMode()
        ? stepRef.current
        : (pinRange > 240
            ? Math.min(1, Math.max(0, (window.scrollY - pinStart) / pinRange)) * (TOTAL - 1)
            : window.scrollY / SCROLL_PX_PER_CARD) + manualRef.current
      const current = progressRef.current
      const delta = target - current
      const next = Math.abs(delta) < 0.001 ? target : current + delta * EASE

      progressRef.current = next
      render(next)

      if (Math.abs(target - next) > 0.001) {
        frameRef.current = window.requestAnimationFrame(tick)
      }
    }

    const kick = () => {
      if (reducedMotionQuery.matches || frameRef.current !== null || !visible) return
      frameRef.current = window.requestAnimationFrame(tick)
    }

    kickRef.current = kick

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              visible = entries.some((entry) => entry.isIntersecting)
              if (visible) kick()
            },
            { threshold: 0 },
          )
        : null
    observer?.observe(root)

    const measurePin = () => {
      if (!pinSection) return
      pinStart = pinSection.getBoundingClientRect().top + window.scrollY
      pinRange = pinSection.offsetHeight - window.innerHeight
    }

    /** Card size follows the available height so a card is never cropped. */
    const applyCardSize = () => {
      const height = root.clientHeight
      if (!height) return
      const size = Math.min(300, Math.max(112, height * 0.47))
      root.style.setProperty("--deck-card-size", Math.round(size) + "px")
    }

    const heroIsActive = () => !pinSection || pinSection.dataset.portalFlipState === "active"

    /** Steps the deck by one card when neither end would be crossed. */
    const stepDeck = (direction: number) => {
      if (!isFlipMode() || !heroIsActive()) return false
      const next = stepRef.current + direction
      if (next < 0 || next > TOTAL - 1) return false
      stepRef.current = next
      kick()
      return true
    }

    let wheelAccumulated = 0
    let wheelStepLock = 0

    const handleFlipWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !isFlipMode() || !heroIsActive()) return

      const direction = event.deltaY > 0 ? 1 : -1
      // At either end the page flip takes over instead of the deck.
      if (direction > 0 ? stepRef.current >= TOTAL - 1 : stepRef.current <= 0) return

      // Capture phase on window: claim the gesture before PortalMotion sees it.
      event.preventDefault()
      event.stopImmediatePropagation()

      const now = performance.now()
      if (now < wheelStepLock) {
        wheelAccumulated = 0
        return
      }

      wheelAccumulated += event.deltaY
      if (Math.abs(wheelAccumulated) < WHEEL_STEP_THRESHOLD) return

      wheelAccumulated = 0
      wheelStepLock = now + WHEEL_STEP_LOCK_MS
      stepDeck(direction)
    }

    const handleFlipKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))
      ) {
        return
      }

      let direction = 0
      if (event.key === "ArrowDown" || event.key === "PageDown") direction = 1
      else if (event.key === "ArrowUp" || event.key === "PageUp") direction = -1
      if (direction === 0 || !stepDeck(direction)) return

      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const handleActFlip = (event: Event) => {
      const detail = (event as CustomEvent<{ act?: string }>).detail
      if (detail?.act !== "01") return
      stepRef.current = 0
      manualRef.current = 0
      // Flip mode resizes the hero, so re-measure before easing back to card 1.
      deckHeight = root.clientHeight
      applyCardSize()
      kick()
    }

    const handleResize = () => {
      deckHeight = root.clientHeight
      measurePin()
      applyCardSize()
      render(progressRef.current)
    }
    const handleMotionChange = () => {
      if (reducedMotionQuery.matches) {
        if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
        progressRef.current = 0
        manualRef.current = 0
        render(0)
        return
      }
      kick()
    }

    measurePin()
    applyCardSize()
    render(progressRef.current)
    kick()

    window.addEventListener("scroll", kick, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    window.addEventListener("wheel", handleFlipWheel, { capture: true, passive: false })
    window.addEventListener("keydown", handleFlipKey, { capture: true })
    window.addEventListener("portal:act-flip", handleActFlip)
    reducedMotionQuery.addEventListener("change", handleMotionChange)

    return () => {
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("wheel", handleFlipWheel, { capture: true })
      window.removeEventListener("keydown", handleFlipKey, { capture: true })
      window.removeEventListener("portal:act-flip", handleActFlip)
      reducedMotionQuery.removeEventListener("change", handleMotionChange)
      observer?.disconnect()
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      if (tiltFrameRef.current !== null) window.cancelAnimationFrame(tiltFrameRef.current)
      frameRef.current = null
      tiltFrameRef.current = null
      kickRef.current = () => {}
    }
  }, [])

  const applyTilt = () => {
    tiltFrameRef.current = null
    const root = rootRef.current
    const tilt = tiltRef.current
    if (!root || !tilt) return

    root.style.setProperty("--deck-tilt-x", (tilt.y * -3.4).toFixed(2) + "deg")
    root.style.setProperty("--deck-tilt-y", (tilt.x * 4.6).toFixed(2) + "deg")
    root.style.setProperty("--deck-shift-x", (tilt.x * 12).toFixed(2) + "px")
    root.style.setProperty("--deck-shift-y", (tilt.y * 9).toFixed(2) + "px")
  }

  const resetTilt = () => {
    const root = rootRef.current
    if (!root) return
    tiltRef.current = null
    if (tiltFrameRef.current !== null) {
      window.cancelAnimationFrame(tiltFrameRef.current)
      tiltFrameRef.current = null
    }
    root.style.setProperty("--deck-tilt-x", "0deg")
    root.style.setProperty("--deck-tilt-y", "0deg")
    root.style.setProperty("--deck-shift-x", "0px")
    root.style.setProperty("--deck-shift-y", "0px")
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root) return

    if (
      event.pointerType === "mouse" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia(REDUCED_MOTION_QUERY).matches
    ) {
      const bounds = root.getBoundingClientRect()
      tiltRef.current = {
        x: Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2)),
      }
      if (tiltFrameRef.current === null) {
        tiltFrameRef.current = window.requestAnimationFrame(applyTilt)
      }
    }

    // Dragging would desync the discrete step the page-flip timeline owns.
    if (isFlipMode()) return

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const delta = event.clientY - drag.lastY
    if (Math.abs(delta) < 0.5) return

    drag.lastY = event.clientY
    drag.moved = true
    manualRef.current -= delta / DRAG_PX_PER_CARD
    kickRef.current()
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, lastY: event.clientY, moved: false }
  }

  const handlePointerUp = () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag?.moved) return

    suppressClickRef.current = true
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  const handlePointerLeave = () => {
    handlePointerUp()
    resetTilt()
  }

  const selectCard = (index: number) => {
    if (suppressClickRef.current) return

    if (isFlipMode()) {
      stepRef.current = index
      kickRef.current()
      return
    }

    let delta = index - progressRef.current
    delta = ((delta % TOTAL) + TOTAL) % TOTAL
    if (delta > TOTAL / 2) delta -= TOTAL

    manualRef.current += delta
    kickRef.current()
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % TOTAL
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      nextIndex = (index - 1 + TOTAL) % TOTAL
    else if (event.key === "Enter" || event.key === " ") nextIndex = index

    if (nextIndex === null) return
    event.preventDefault()
    event.stopPropagation()
    selectCard(nextIndex)
  }

  return (
    <div
      ref={rootRef}
      className="portal-flip-deck"
      data-portal-reveal
      data-delay="340"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div className="portal-flip-deck__viewport">
        <div className="portal-flip-deck__tilt">
          <div className="portal-flip-deck__track">
            {DECK_CARDS.map((card, index) => (
              <div
                key={card.src}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
                className="portal-flip-card"
                data-world={card.world}
                role="button"
                tabIndex={index === 0 ? 0 : -1}
                aria-label={isZh ? card.nameZh : card.name}
                // Width ratio per card lives in data; the CSS variable keeps styling in CSS.
                style={{ "--deck-card-w": card.widthFactor } as React.CSSProperties}
                onClick={() => selectCard(index)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
              >
                <div className="portal-flip-card__panel">
                  <span className="portal-flip-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Image
                    src={card.src}
                    alt={isZh ? card.nameZh : card.name}
                    width={900}
                    height={900}
                    sizes="(max-width: 767px) 42vw, (max-width: 1023px) 34vw, 22vw"
                    priority={index < 2}
                    className="portal-flip-card__image"
                  />
                  <span className="portal-flip-card__caption">
                    <em>
                      {card.world === "medical"
                        ? isZh
                          ? "医疗健康"
                          : "Medical"
                        : isZh
                          ? "家庭生活"
                          : "Home"}
                    </em>
                    <strong>{isZh ? card.nameZh : card.name}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="portal-flip-deck__hint" aria-hidden="true">
        <i />
        {isZh ? "滚动 · 点击 · 翻转" : "Scroll · click · flip"}
      </span>
    </div>
  )
}
