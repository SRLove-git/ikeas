"use client"

import { useEffect, useRef } from "react"

const REVEAL_SELECTOR = "[data-portal-reveal]"
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

export function useReveal<T extends HTMLElement>() {
  const rootRef = useRef<T>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))

    revealElements.forEach((element) => {
      const delay = element.dataset.delay
      if (delay !== undefined) {
        const normalizedDelay = /^\d+(?:\.\d+)?$/.test(delay.trim()) ? `${delay.trim()}ms` : delay
        element.style.setProperty("--portal-reveal-delay", normalizedDelay)
      }
    })

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    let observer: IntersectionObserver | null = null

    const revealAll = () => {
      revealElements.forEach((element) => element.classList.add("is-visible"))
    }

    const observePendingElements = () => {
      observer?.disconnect()
      observer = null

      if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
        revealAll()
        return
      }

      const pendingElements = revealElements.filter(
        (element) => !element.classList.contains("is-visible"),
      )
      if (pendingElements.length === 0) return

      observer = new IntersectionObserver(
        (entries, currentObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            entry.target.classList.add("is-visible")
            currentObserver.unobserve(entry.target)
          })
        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -12% 0px",
        },
      )

      pendingElements.forEach((element) => observer?.observe(element))
    }

    observePendingElements()
    root.classList.add("portal-motion-ready")
    reducedMotionQuery.addEventListener("change", observePendingElements)

    return () => {
      reducedMotionQuery.removeEventListener("change", observePendingElements)
      observer?.disconnect()
      root.classList.remove("portal-motion-ready")
    }
  }, [])

  return rootRef
}
