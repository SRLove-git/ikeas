import { SiteLayout } from "@/components/SiteLayout"
import { BookingForm } from "@/components/BookingForm"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GiftIcon } from "@/components/icons"
import { getLocale, getServerT } from "@/i18n/server"

export default async function BookingPage() {
  const locale = await getLocale()
  const t = await getServerT(locale)
  return (
    <SiteLayout>
      <div className="mx-auto max-w-page px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("booking.currentLabel")} />

        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{t("booking.title")}</h1>
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-ikea-blue/15 bg-gradient-to-r from-ikea-blue/5 via-ikea-blue/[0.02] to-transparent">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-ikea-blue to-ikea-blue/40"
            />
            <div className="flex items-center gap-4 py-4 pl-6 pr-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ikea-blue text-white shadow-md shadow-ikea-blue/25 ring-4 ring-ikea-blue/10">
                <GiftIcon width={22} height={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-ikea-blue">
                  {t("booking.introLabel")}
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-ikea-black">
                  {t("booking.intro")}
                </p>
              </div>
            </div>
          </div>
          <BookingForm />
        </div>
      </div>
    </SiteLayout>
  )
}
