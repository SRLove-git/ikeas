"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"

export interface TeamMember {
  name: string
  position: string
  image: string | null
  href?: string | null
}

export interface TeamGroup {
  id: string
  title: string
  description?: string
  members: TeamMember[]
}

interface CorporateTeamTabsProps {
  groups: TeamGroup[]
}

function MemberLink({ href, children }: { href?: string | null; children: ReactNode }) {
  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className="block">
          {children}
        </Link>
      )
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {children}
      </a>
    )
  }
  return <>{children}</>
}

/**
 * Huawei-style member tabs: a centred sticky tab bar switches between team
 * groups, rendering only the members of the selected group.
 */
export function CorporateTeamTabs({ groups }: CorporateTeamTabsProps) {
  const { t } = useTranslation()
  const barRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "")
  const [headerOffset, setHeaderOffset] = useState(0)
  const active = groups.find((group) => group.id === activeId) ?? groups[0]

  useEffect(() => {
    const applyHash = () => {
      const hashId = window.location.hash.replace(/^#/, "")
      if (!groups.some((group) => group.id === hashId)) return
      setActiveId(hashId)
      window.setTimeout(() => {
        const section = document.getElementById(hashId)
        if (!section) return
        const header = document.querySelector(".i-layout__header")
        const offset = header ? header.getBoundingClientRect().height : 0
        const y = section.getBoundingClientRect().top + window.scrollY - offset - 12
        window.scrollTo({ top: y, behavior: "smooth" })
      }, 0)
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [groups])

  useEffect(() => {
    const header = document.querySelector(".i-layout__header")
    const updateOffset = () => {
      setHeaderOffset(header ? header.getBoundingClientRect().height : 0)
    }
    updateOffset()
    window.addEventListener("resize", updateOffset)
    return () => window.removeEventListener("resize", updateOffset)
  }, [])

  const selectGroup = (id: string) => {
    setActiveId(id)
    history.replaceState(null, "", `#${id}`)
  }

  if (groups.length === 0 || !active) return null

  return (
    <>
      <div
        ref={barRef}
        className="sticky z-[890] border-b border-ikea-gray-200 bg-white"
        style={{ top: headerOffset }}
      >
        <div className="max-w-page mx-auto">
          <div className="overflow-x-auto no-scrollbar">
            <div className="mx-auto flex w-max" role="tablist">
              {groups.map((group) => {
                const selected = group.id === active.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={group.id}
                    onClick={() => selectGroup(group.id)}
                    className={`flex h-14 shrink-0 items-center border-b-2 px-6 text-sm font-bold transition-colors ${
                      selected
                        ? "border-ikea-blue text-ikea-blue"
                        : "border-transparent text-ikea-muted hover:text-ikea-black"
                    }`}
                  >
                    {group.title}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <section id={active.id} aria-labelledby={`tab-${active.id}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-8 lg:text-2xl">{active.title}</h2>
            {active.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ikea-muted">
                {active.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {active.members.map((member, i) => (
            <MemberLink key={i} href={member.href}>
              <div className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-ikea-gray-100">
                  {member.image ? (
                    <SiteImage
                      src={member.image}
                      alt={member.name}
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
                      <span className="text-xs text-ikea-muted">{t("content.avatarPending")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-ikea-black">{member.name}</div>
                  {member.position ? (
                    <div className="mt-0.5 text-xs text-ikea-muted">{member.position}</div>
                  ) : null}
                </div>
              </div>
            </MemberLink>
          ))}
        </div>
      </section>
    </>
  )
}
