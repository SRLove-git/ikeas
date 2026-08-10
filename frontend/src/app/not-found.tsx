import Link from "next/link"
import { SiteImage } from "@/components/SiteImage"
import { getSettings } from "@/lib/admin-store"

export default function NotFound() {
  const { siteCopy } = getSettings()
  return (
    <main className="font-ikea flex min-h-screen items-center justify-center bg-white text-ikea-black">
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <SiteImage
          src="/images/products/buzud-8885020712582.jpg"
          alt="404"
          className="w-[260px] lg:w-[360px]"
          imgClassName="h-auto object-contain"
        />
        <h1 className="mt-8 text-base font-bold">{siteCopy.notFound.title}</h1>
        <p className="mt-3 max-w-[332px] text-sm leading-6 text-ikea-muted">
          {siteCopy.notFound.body}
        </p>
        <Link
          href="/"
          className="i-btn i-btn--primary mt-6 inline-flex h-10 items-center px-6 text-xs font-bold text-white"
        >
          <span className="i-btn__label">{siteCopy.notFound.buttonLabel}</span>
        </Link>
      </div>
    </main>
  )
}
