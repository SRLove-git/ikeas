import type { SiteScope } from "@/lib/site-scope"

const SCOPE_LABELS: Record<SiteScope, string> = {
  medical: "MEDICAL & HEALTH",
  home: "HOME & LIVING",
  portal: "HEALTH · HOME · LIFE",
}

export function BrandMark({
  scope,
  compactOnMobile = false,
}: {
  scope: SiteScope
  compactOnMobile?: boolean
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ikea-black text-[11px] font-bold tracking-[-0.04em] text-white"
        aria-hidden="true"
      >
        CY
      </span>
      <span
        className={`${compactOnMobile ? "hidden lg:flex" : "flex"} min-w-0 flex-col leading-none`}
      >
        <span className="whitespace-nowrap text-sm font-bold tracking-[0.08em] text-ikea-black">
          CHUNG YIP
        </span>
        <span className="mt-1 whitespace-nowrap text-[8px] font-bold tracking-[0.16em] text-ikea-muted">
          {SCOPE_LABELS[scope]}
        </span>
      </span>
    </span>
  )
}
