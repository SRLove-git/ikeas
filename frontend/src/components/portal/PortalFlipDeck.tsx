"use client"

import Image from "next/image"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react"
import { HOME_URL, MEDICAL_URL } from "@/lib/site-scope"
import styles from "./PortalFlipDeck.module.css"

const products = [
  {
    image: "wheelchair",
    brand: "BUZUD",
    name: "Pushchair QK805",
    zh: "轻便轮椅 QK805",
    path: "p/buzud-pushchair-qk805labj-8885020710946",
    field: "#91b5a9",
    light: "#c5d8ce",
  },
  {
    image: "oven",
    brand: "Toshiba",
    name: "50L built-in oven",
    zh: "50L 嵌入式烤箱",
    path: "toshiba/p/eb-t500apw",
    field: "#b8876b",
    light: "#e4c9b4",
  },
  {
    image: "bp",
    brand: "BUZUD",
    name: "Blood pressure monitor 30S",
    zh: "血压计 30S",
    path: "p/buzud-blood-pressure-monitor-30s-8885020711097",
    field: "#86a9b1",
    light: "#c4d7d8",
  },
  {
    image: "fridge",
    brand: "Midea",
    name: "Multi-door refrigerator",
    zh: "多门冰箱",
    path: "midea/p/mdrf632fid46sg",
    field: "#b0a18c",
    light: "#e5d9c7",
  },
  {
    image: "oximeter",
    brand: "BUZUD",
    name: "Fingertip pulse oximeter 70B",
    zh: "指夹式血氧仪 70B",
    path: "p/buzud-fingertip-pulse-oximeter-70b-8885020711479",
    field: "#9baaba",
    light: "#d0d8e3",
  },
  {
    image: "dishwasher",
    brand: "Toshiba",
    name: "Dishwasher",
    zh: "洗碗机",
    path: "toshiba/p/dw-14f7-ss-sg",
    field: "#ba998c",
    light: "#e4cfc4",
  },
] as const

const lastIndex = products.length - 1
const limit = (value: number) => Math.max(0, Math.min(lastIndex, value))

function productUrl(product: (typeof products)[number], isZh: boolean) {
  const origin = product.path.startsWith("p/") ? MEDICAL_URL : HOME_URL
  return `${origin}/${isZh ? "zh" : "en"}/${product.path}/`
}

export function PortalFlipDeck({
  isZh,
  heading,
  children,
}: {
  isZh: boolean
  heading: ReactNode
  children: ReactNode
}) {
  const [selection, setSelection] = useState({ index: 0, direction: 1 })
  const { index, direction } = selection
  const root = useRef<HTMLDivElement>(null)
  const gallery = useRef<HTMLDivElement>(null)
  const selected = useRef(0)
  const drag = useRef<{
    id: number
    x: number
    y: number
    horizontal: boolean
    span: number
    offset: number
    dragging: boolean
  } | null>(null)
  const blockClick = useRef(false)

  const select = (value: number) => {
    const next = limit(value)
    const previous = selected.current
    if (next === previous) return
    selected.current = next
    setSelection({ index: next, direction: Math.sign(next - previous) })
  }

  useLayoutEffect(() => {
    const viewport = gallery.current
    if (viewport?.contains(document.activeElement)) {
      viewport
        .querySelector<HTMLAnchorElement>('a[data-stage="active"]')
        ?.focus({ preventScroll: true })
    }
  }, [index])

  useEffect(() => {
    const section = root.current?.closest<HTMLElement>("[data-portal-act]")
    if (!section) return
    let lastWheel = -Infinity
    let spent = false
    let accumulated = 0
    const inFlipHero = () =>
      document.documentElement.dataset.portalFlip === "true" &&
      section.dataset.portalFlipState === "active"
    const step = (direction: number) => {
      const next = selected.current + direction
      if (next < 0 || next > lastIndex) return false
      select(next)
      return true
    }

    // Keep the tail of a trackpad gesture on the final product. A fresh
    // gesture at the end can then reach the next chapter.
    const wheel = (event: WheelEvent) => {
      if (
        !inFlipHero() ||
        event.ctrlKey ||
        !event.deltaY ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return
      const time = performance.now()
      if (time - lastWheel > 150) {
        spent = false
        accumulated = 0
      }
      lastWheel = time
      const direction = Math.sign(event.deltaY)
      if (!spent && limit(selected.current + direction) === selected.current) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (spent) return
      if (Math.sign(accumulated) !== direction) accumulated = 0
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      accumulated += event.deltaY * unit
      if (Math.abs(accumulated) >= 40) spent = step(direction)
    }

    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.isContentEditable || target?.closest("input, select, textarea, [role=dialog]"))
        return
      const local = !!target && root.current?.contains(target)
      let delta = 0
      if ((inFlipHero() || local) && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        delta = event.key === "ArrowRight" ? 1 : -1
      } else if (inFlipHero() && (event.key === "ArrowDown" || event.key === "PageDown")) delta = 1
      else if (inFlipHero() && (event.key === "ArrowUp" || event.key === "PageUp")) delta = -1
      if (!delta || event.repeat || !step(delta)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const enterChapter = (event: Event) => {
      if ((event as CustomEvent<{ act?: string }>).detail?.act === "01") {
        select(0)
        lastWheel = -Infinity
        spent = false
      }
    }
    window.addEventListener("wheel", wheel, { capture: true, passive: false })
    window.addEventListener("keydown", key, true)
    window.addEventListener("portal:act-flip", enterChapter)
    return () => {
      window.removeEventListener("wheel", wheel, true)
      window.removeEventListener("keydown", key, true)
      window.removeEventListener("portal:act-flip", enterChapter)
    }
  }, [])

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    const viewport = event.currentTarget
    const horizontal = window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches
    const sheet = viewport.querySelector<HTMLElement>('[data-stage="active"]')
    blockClick.current = false
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      horizontal,
      span: Math.max(1, (horizontal ? sheet?.offsetWidth : sheet?.offsetHeight) ?? 300),
      offset: 0,
      dragging: false,
    }
  }

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const input = drag.current
    if (!input || event.pointerId !== input.id) return
    const dx = event.clientX - input.x
    const dy = event.clientY - input.y
    const distance = input.horizontal ? dx : dy
    if (!input.dragging) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return
      if (Math.abs(input.horizontal ? dy : dx) > Math.abs(distance)) {
        drag.current = null
        return
      }
      input.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ""
    }
    input.offset =
      limit(selected.current - Math.max(-1, Math.min(1, distance / input.span))) - selected.current
    event.currentTarget.style.setProperty("--pull", String(input.offset))
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancel = false) => {
    const input = drag.current
    if (!input || event.pointerId !== input.id) return
    drag.current = null
    if (!input.dragging) return
    blockClick.current = true
    const viewport = event.currentTarget
    delete viewport.dataset.dragging
    viewport.style.removeProperty("--pull")
    if (!cancel && Math.abs(input.offset) > 0.12) select(selected.current + Math.sign(input.offset))
    if (viewport.hasPointerCapture(input.id)) viewport.releasePointerCapture(input.id)
  }

  const product = products[index]
  const medical = product.path.startsWith("p/")
  const world = medical
    ? isZh
      ? "医疗健康"
      : "Medical & Health"
    : isZh
      ? "家庭生活"
      : "Home & Living"
  const name = isZh ? product.zh : product.name
  return (
    <div
      ref={root}
      className={styles.showcase}
      data-world={medical ? "medical" : "home"}
      style={{ "--direction": direction } as CSSProperties}
    >
      <div className={styles.heading}>{heading}</div>
      <div className={styles.details}>
        <div className={styles.caption} key={index} aria-hidden="true">
          <p className={styles.category}>
            {world}
            <span />
            {product.brand}
          </p>
          <p className={styles.productName}>{name}</p>
        </div>
        <span className="sr-only" role="status">
          {product.brand} {name}
        </span>
      </div>
      <div
        ref={gallery}
        className={styles.gallery}
        data-product-gallery
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onLostPointerCapture={(event) => {
          // Touch transfers implicit capture from the image link to the gallery.
          if (event.target === event.currentTarget) finishDrag(event, true)
        }}
        onPointerLeave={() => {
          if (!drag.current?.dragging) drag.current = null
        }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!blockClick.current || event.detail === 0) return
          event.preventDefault()
          event.stopPropagation()
          blockClick.current = false
        }}
      >
        {products.map((item, i) => {
          const offset = i - index
          const current = offset === 0
          return (
            <a
              key={item.image}
              href={productUrl(item, isZh)}
              className={styles.sheet}
              data-stage={current ? "active" : Math.abs(offset) === 1 ? "near" : "far"}
              tabIndex={current ? 0 : -1}
              aria-label={
                isZh
                  ? `查看商品：${item.brand} ${item.zh}`
                  : `View product: ${item.brand} ${item.name}`
              }
              aria-hidden={current ? undefined : true}
              draggable={false}
              style={
                {
                  "--offset": offset,
                  "--field": item.field,
                  "--light": item.light,
                } as CSSProperties
              }
              onClick={(event) => {
                if (current || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
                  return
                event.preventDefault()
                select(i)
              }}
            >
              <div className={styles.plate}>
                <Image
                  src={`/images/portal/card-${item.image}.png`}
                  alt=""
                  width={900}
                  height={900}
                  sizes="(max-width: 1023px) 60vw, 34vw"
                  loading={i < 2 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  draggable={false}
                />
              </div>
            </a>
          )
        })}
      </div>
      <div className={styles.stores}>{children}</div>
    </div>
  )
}
