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
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <GiftIcon width={20} height={20} />
            </span>
            <p className="text-sm font-bold leading-6 text-amber-900">{t("booking.intro")}</p>
          </div>
          <BookingForm />
        </div>
      </div>
    </SiteLayout>
  )
}
