import type { SiteScope } from "@/lib/site-scope"

export function BrandMark({
  scope,
  compactOnMobile = false,
}: {
  scope: SiteScope
  compactOnMobile?: boolean
}) {
  const alt =
    scope === "medical"
      ? "CHUNG YIP Medical & Health"
      : scope === "home"
        ? "CHUNG YIP Home & Living"
        : "CHUNG YIP"

  return (
    // This is the original blue water-drop logo kept in the local public assets.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo/logo.png"
      alt={alt}
      width={480}
      height={334}
      className={`disable-event w-auto object-contain ${compactOnMobile ? "h-14" : "h-9 lg:h-10"}`}
    />
  )
}
