"use client"

import { useEffect, type ReactNode } from "react"
import { useReveal } from "@/hooks/useReveal"
import chapters from "./portal-chapters.module.css"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
const DESKTOP_MIN_WIDTH = 1024
const FLIP_VIEWPORT_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (hover: hover) and (pointer: fine)"
const HEADER_HIDE_SCROLL_Y = 120
const WORLD_ZOOM_THRESHOLD = 0.35
const WORLD_PARALLAX_PX = 20
const FLIP_WHEEL_THRESHOLD = 44
const FLIP_LOCK_MS = 880
const FLIP_IDLE_RESET_MS = 160

interface PortalMotionProps {
  children: ReactNode
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  )
}

export function PortalMotion({ children }: PortalMotionProps) {
  const rootRef = useReveal<HTMLDivElement>()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const header = root.querySelector<HTMLElement>(".portal-header")
    const footer = root.querySelector<HTMLElement>(".portal-footer")
    const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-portal-act]"))
    const progressItems = Array.from(
      root.querySelectorAll<HTMLAnchorElement>("[data-portal-progress-item]"),
    )
    const worlds = Array.from(root.querySelectorAll<HTMLElement>(".portal-world"))
    const worldVisuals = worlds
      .map((world) => world.querySelector<HTMLElement>(".portal-world__visual"))
      .filter((visual): visual is HTMLElement => visual !== null)
    const introElements = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".portal-hero__intro-item, .portal-hero__title-line > span",
      ),
    )
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const flipViewport = window.matchMedia(FLIP_VIEWPORT_QUERY)

    let lastScrollY = Math.max(window.scrollY, 0)
    let scrollFrame: number | null = null
    let resizeFrame: number | null = null
    let flipLockTimer: number | null = null
    let wheelResetTimer: number | null = null
    let worldObserver: IntersectionObserver | null = null
    let flipEnabled = false
    let flipLocked = false
    let wheelAccumulator = 0
    let activeFlipIndex = 0

    const showHeader = () => {
      header?.classList.remove("is-hidden")
    }

    const headerHasFocus = () => {
      return header?.contains(document.activeElement) ?? false
    }

    const updateHeader = (currentScrollY: number) => {
      if (flipEnabled) {
        showHeader()
        return
      }

      const isScrollingDown = currentScrollY > lastScrollY
      const isScrollingUp = currentScrollY < lastScrollY

      if (
        reducedMotionQuery.matches ||
        headerHasFocus() ||
        currentScrollY <= HEADER_HIDE_SCROLL_Y ||
        isScrollingUp
      ) {
        showHeader()
      } else if (isScrollingDown) {
        header?.classList.add("is-hidden")
      }
    }

    const setProgressActive = (activeAct: string | undefined) => {
      progressItems.forEach((item) => {
        if (item.dataset.portalProgressItem === activeAct)
          item.setAttribute("aria-current", "location")
        else item.removeAttribute("aria-current")
      })
    }

    const updateProgress = () => {
      if (acts.length === 0 || progressItems.length === 0) return

      if (flipEnabled) {
        setProgressActive(acts[activeFlipIndex]?.dataset.portalAct)
        return
      }

      const viewportAnchor = window.innerHeight * 0.5
      let activeAct = acts[0]?.dataset.portalAct

      acts.forEach((act) => {
        if (act.getBoundingClientRect().top <= viewportAnchor) {
          activeAct = act.dataset.portalAct
        }
      })

      setProgressActive(activeAct)
    }

    const clearWorldParallax = () => {
      worldVisuals.forEach((visual) => visual.style.removeProperty("--portal-image-y"))
    }

    const updateWorldParallax = () => {
      const motionEnabled =
        !flipEnabled && window.innerWidth >= DESKTOP_MIN_WIDTH && !reducedMotionQuery.matches

      if (!motionEnabled) {
        clearWorldParallax()
        return
      }

      const viewportCenter = window.innerHeight / 2
      worldVisuals.forEach((visual) => {
        const bounds = visual.getBoundingClientRect()
        const travelRange = viewportCenter + bounds.height / 2
        const normalizedOffset = clamp(
          (bounds.top + bounds.height / 2 - viewportCenter) / travelRange,
          -1,
          1,
        )
        const offset = normalizedOffset * -WORLD_PARALLAX_PX
        visual.style.setProperty("--portal-image-y", offset.toFixed(2) + "px")
      })
    }

    const updateViewportMotion = () => {
      scrollFrame = null
      const currentScrollY = Math.max(window.scrollY, 0)
      updateHeader(currentScrollY)
      updateProgress()
      updateWorldParallax()
      lastScrollY = currentScrollY
    }

    const scheduleViewportMotion = () => {
      if (scrollFrame !== null) return
      scrollFrame = window.requestAnimationFrame(updateViewportMotion)
    }

    const clearWorldZoom = () => {
      worlds.forEach((world) => world.classList.remove("is-zoomed"))
    }

    const syncFlipWorldZoom = () => {
      worlds.forEach((world) => {
        world.classList.toggle("is-zoomed", world === acts[activeFlipIndex])
      })
    }

    const setupWorldObserver = () => {
      worldObserver?.disconnect()
      worldObserver = null
      clearWorldZoom()

      if (flipEnabled) {
        syncFlipWorldZoom()
        return
      }

      const canZoom = window.innerWidth >= DESKTOP_MIN_WIDTH && !reducedMotionQuery.matches

      if (!canZoom || worlds.length === 0 || !("IntersectionObserver" in window)) {
        return
      }

      worldObserver = new IntersectionObserver(
        (entries) => {
          const motionEnabled =
            !flipEnabled && window.innerWidth >= DESKTOP_MIN_WIDTH && !reducedMotionQuery.matches

          entries.forEach((entry) => {
            entry.target.classList.toggle(
              "is-zoomed",
              motionEnabled &&
                entry.isIntersecting &&
                entry.intersectionRatio >= WORLD_ZOOM_THRESHOLD,
            )
          })
        },
        { threshold: WORLD_ZOOM_THRESHOLD },
      )

      worlds.forEach((world) => worldObserver?.observe(world))
    }

    const applyFlipState = (nextIndex: number, moveFocus = false) => {
      const boundedIndex = clamp(nextIndex, 0, Math.max(acts.length - 1, 0))
      const outgoingAct = acts[activeFlipIndex]
      const shouldMoveFocus =
        moveFocus ||
        outgoingAct?.contains(document.activeElement) ||
        footer?.contains(document.activeElement)

      activeFlipIndex = boundedIndex
      const activeAct = acts[activeFlipIndex]
      const activeNumber = activeAct?.dataset.portalAct

      acts.forEach((act, index) => {
        act.toggleAttribute("data-portal-leaving", act === outgoingAct && act !== activeAct)
        act.dataset.portalFlipState =
          index < activeFlipIndex ? "previous" : index > activeFlipIndex ? "next" : "active"
        act.inert = index !== activeFlipIndex
        if (index === activeFlipIndex) {
          act.removeAttribute("aria-hidden")
        } else {
          act.setAttribute("aria-hidden", "true")
        }
      })

      if (activeNumber) {
        root.dataset.portalFlipActive = activeNumber
      }
      setProgressActive(activeNumber)
      syncFlipWorldZoom()

      const footerIsActive = activeFlipIndex === acts.length - 1
      if (footer) {
        footer.inert = !footerIsActive
        if (footerIsActive) footer.removeAttribute("aria-hidden")
        else footer.setAttribute("aria-hidden", "true")
      }

      if (shouldMoveFocus) {
        activeAct?.focus({ preventScroll: true })
      }
    }

    const clearFlipTimers = () => {
      if (flipLockTimer !== null) window.clearTimeout(flipLockTimer)
      if (wheelResetTimer !== null) window.clearTimeout(wheelResetTimer)
      flipLockTimer = null
      wheelResetTimer = null
    }

    const lockFlip = () => {
      flipLocked = true
      if (flipLockTimer !== null) window.clearTimeout(flipLockTimer)
      flipLockTimer = window.setTimeout(() => {
        flipLocked = false
        flipLockTimer = null
        delete root.dataset.portalFlipDirection
        root.querySelector("[data-portal-leaving]")?.removeAttribute("data-portal-leaving")
      }, FLIP_LOCK_MS)
    }

    const goToFlipAct = (nextIndex: number, moveFocus = false) => {
      const boundedIndex = clamp(nextIndex, 0, Math.max(acts.length - 1, 0))
      if (!flipEnabled || boundedIndex === activeFlipIndex) return
      lockFlip()
      root.dataset.portalFlipDirection = boundedIndex > activeFlipIndex ? "forward" : "backward"
      applyFlipState(boundedIndex, moveFocus)
    }

    const hashIndex = () => acts.findIndex((act) => `#${act.id}` === window.location.hash)

    const enableFlip = (initial: boolean) => {
      if (flipEnabled || acts.length === 0) return

      const viewportAnchor = window.innerHeight * 0.5
      let nearestIndex = 0
      acts.forEach((act, index) => {
        if (act.getBoundingClientRect().top <= viewportAnchor) nearestIndex = index
      })

      flipEnabled = true
      const linkedIndex = initial ? hashIndex() : -1
      activeFlipIndex = linkedIndex >= 0 ? linkedIndex : nearestIndex
      root.dataset.portalFlip = "true"
      document.documentElement.dataset.portalFlip = "true"
      window.scrollTo({ top: 0, behavior: "instant" })
      showHeader()
      clearWorldParallax()
      worldObserver?.disconnect()
      worldObserver = null
      applyFlipState(activeFlipIndex)
    }

    const disableFlip = (restoreScroll = true) => {
      if (!flipEnabled) return

      const restoreAct = acts[activeFlipIndex]
      flipEnabled = false
      flipLocked = false
      wheelAccumulator = 0
      clearFlipTimers()
      delete root.dataset.portalFlip
      delete root.dataset.portalFlipActive
      delete root.dataset.portalFlipDirection
      delete document.documentElement.dataset.portalFlip

      acts.forEach((act) => {
        delete act.dataset.portalFlipState
        act.removeAttribute("data-portal-leaving")
        act.inert = false
        act.removeAttribute("aria-hidden")
      })

      if (footer) {
        footer.inert = false
        footer.removeAttribute("aria-hidden")
      }
      clearWorldZoom()
      if (restoreScroll && restoreAct) {
        const restoreTop = restoreAct.offsetTop
        window.scrollTo({ top: restoreTop, behavior: "instant" })
      }
    }

    const syncFlipMode = (initial = false) => {
      if (flipViewport.matches && !reducedMotionQuery.matches) enableFlip(initial)
      else disableFlip()
    }

    const followChapterLink = (event: MouseEvent) => {
      if (
        !flipEnabled ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = event.currentTarget as HTMLAnchorElement
      const nextIndex = acts.findIndex((act) => `#${act.id}` === link.hash)
      if (nextIndex < 0) return
      event.preventDefault()
      if (location.hash !== link.hash) window.history.pushState(null, "", link.hash)
      if (nextIndex === activeFlipIndex) acts[nextIndex].focus({ preventScroll: true })
      else goToFlipAct(nextIndex, true)
    }

    const followLocation = () => {
      if (!flipEnabled) return
      const nextIndex = window.location.hash ? hashIndex() : 0
      if (nextIndex >= 0) goToFlipAct(nextIndex, true)
    }

    const stepChapter = (nextIndex: number, moveFocus = false) => {
      goToFlipAct(nextIndex, moveFocus)
      if (hashIndex() >= 0) {
        window.history.replaceState(window.history.state, "", `#${acts[activeFlipIndex].id}`)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      if (
        !flipEnabled ||
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return
      event.preventDefault()
      if (flipLocked) return

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      if (wheelAccumulator * event.deltaY < 0) wheelAccumulator = 0
      wheelAccumulator += event.deltaY * unit
      if (wheelResetTimer !== null) window.clearTimeout(wheelResetTimer)
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0
        wheelResetTimer = null
      }, FLIP_IDLE_RESET_MS)

      if (Math.abs(wheelAccumulator) < FLIP_WHEEL_THRESHOLD) return
      const direction = wheelAccumulator > 0 ? 1 : -1
      wheelAccumulator = 0
      stepChapter(activeFlipIndex + direction)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !flipEnabled ||
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return
      }
      if (isEditableTarget(event.target)) return
      if (
        event.key === " " &&
        event.target instanceof Element &&
        event.target.closest("button, [role=button]")
      )
        return

      let nextIndex: number | null = null
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        nextIndex = activeFlipIndex + (event.shiftKey ? -1 : 1)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        nextIndex = activeFlipIndex - 1
      } else if (event.key === "Home") {
        nextIndex = 0
      } else if (event.key === "End") {
        nextIndex = acts.length - 1
      }

      if (nextIndex === null) return
      const boundedIndex = clamp(nextIndex, 0, acts.length - 1)
      if (boundedIndex === activeFlipIndex) return
      event.preventDefault()
      stepChapter(boundedIndex, true)
    }

    const scheduleMotionRefresh = () => {
      if (resizeFrame !== null) return

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null
        syncFlipMode()
        setupWorldObserver()
        scheduleViewportMotion()
      })
    }

    const handleReducedMotionChange = () => {
      syncFlipMode()
      if (reducedMotionQuery.matches) {
        showHeader()
        clearWorldParallax()
      }
      setupWorldObserver()
      scheduleViewportMotion()
    }

    const handleHeaderFocus = () => {
      showHeader()
    }

    const handleIntroAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== event.currentTarget || !event.animationName.startsWith("portal-")) return
      const element = event.currentTarget as HTMLElement
      element.classList.add("portal-animation-complete")
    }

    introElements.forEach((element) => {
      element.addEventListener("animationend", handleIntroAnimationEnd)
    })
    syncFlipMode(true)
    setupWorldObserver()
    updateViewportMotion()

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("hashchange", followLocation)
    progressItems.forEach((link) => link.addEventListener("click", followChapterLink))
    flipViewport.addEventListener("change", scheduleMotionRefresh)
    window.addEventListener("scroll", scheduleViewportMotion, { passive: true })
    window.addEventListener("resize", scheduleMotionRefresh, { passive: true })
    header?.addEventListener("focusin", handleHeaderFocus)
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("hashchange", followLocation)
      progressItems.forEach((link) => link.removeEventListener("click", followChapterLink))
      flipViewport.removeEventListener("change", scheduleMotionRefresh)
      window.removeEventListener("scroll", scheduleViewportMotion)
      window.removeEventListener("resize", scheduleMotionRefresh)
      header?.removeEventListener("focusin", handleHeaderFocus)
      introElements.forEach((element) => {
        element.removeEventListener("animationend", handleIntroAnimationEnd)
      })
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange)

      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame)

      clearFlipTimers()
      worldObserver?.disconnect()
      disableFlip(false)
      showHeader()
      clearWorldZoom()
      clearWorldParallax()
    }
  }, [rootRef])

  return (
    <div ref={rootRef} className={`portal-motion ${chapters.stage}`}>
      {children}
    </div>
  )
}
