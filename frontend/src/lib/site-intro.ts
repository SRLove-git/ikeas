import { loadDataJson } from "@/lib/data-files"

export type IntroSite = "portal" | "home"
export interface IntroText {
  eyebrow: string
  title: string
  description: string
}
export type SiteIntro = Record<"zh" | "en", IntroText>

export function getSiteIntro(site: IntroSite) {
  return loadDataJson<SiteIntro>(`site-intros/${site}.json`)
}
