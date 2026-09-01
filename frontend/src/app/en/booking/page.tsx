import { SiteLayout } from "@/components/SiteLayout"
import { BookingForm } from "@/components/BookingForm"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { getServerT } from "@/i18n/server"

export default async function EnBookingPage() {
  const t = await getServerT("en")
  return (
    <SiteLayout locale="en">
      <div className="mx-auto max-w-page px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("booking.currentLabel")} />

        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{t("booking.title")}</h1>
          <p className="mt-4 text-sm leading-6 text-ikea-muted">{t("booking.intro")}</p>
          <BookingForm />
        </div>
      </div>
    </SiteLayout>
  )
}
