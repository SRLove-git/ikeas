"use client"

import { useLayoutEffect, useRef } from "react"
import styles from "./PortalOpening.module.css"

let playedInDocument = false

export function PortalOpening() {
  const curtainRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useLayoutEffect(() => {
    const curtain = curtainRef.current
    if (!curtain) return

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
    const skip =
      (playedInDocument && !started.current) ||
      motion.matches ||
      location.hash ||
      window.scrollY > 0 ||
      navigation?.type === "back_forward"
    const animations = curtain.getAnimations()
    if (skip || animations.length === 0) {
      curtain.hidden = true
      return
    }

    started.current = true
    playedInDocument = true
    const controller = new AbortController()
    const { signal } = controller
    const finish = () => {
      curtain.hidden = true
      controller.abort()
    }

    for (const event of [
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
      "focusin",
      "pagehide",
      "hashchange",
    ]) {
      window.addEventListener(event, finish, { capture: true, passive: true, signal })
    }
    motion.addEventListener("change", finish, { signal })

    // The CSS timeline starts at first paint, even if hydration arrives late.
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!signal.aborted) finish()
    })
    return () => controller.abort()
  }, [])

  return <div ref={curtainRef} className={styles.curtain} data-portal-opening aria-hidden="true" />
}
