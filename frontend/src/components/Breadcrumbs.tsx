import Link from "next/link"

interface BreadcrumbsProps {
  currentLabel: string
  className?: string
}

/**
 * Simple two-level breadcrumb: 首页 / 当前页. Intermediate pages are never
 * shown, no matter how the user navigated here.
 */
export function Breadcrumbs({ currentLabel, className = "mb-6" }: BreadcrumbsProps) {
  return (
    <nav className={`flex flex-wrap items-center gap-2 text-sm text-ikea-muted ${className}`}>
      <Link href="/" className="hover:text-ikea-black">
        首页
      </Link>
      <span>/</span>
      <span className="text-ikea-black">{currentLabel}</span>
    </nav>
  )
}
