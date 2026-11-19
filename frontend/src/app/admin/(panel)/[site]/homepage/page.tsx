import { notFound } from "next/navigation"
import { MedicalHomepageEditor } from "@/components/admin/MedicalHomepageEditor"
import { SiteIntroEditor } from "@/components/admin/SiteIntroEditor"
import { getSiteIntro } from "@/lib/site-intro"

export default async function HomepagePage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params
  if (site === "medical") return <MedicalHomepageEditor />
  if (site !== "home" && site !== "portal") notFound()
  return <SiteIntroEditor key={site} site={site} initial={getSiteIntro(site)} />
}
