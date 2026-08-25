import { SiteLayout } from "@/components/SiteLayout";
import { WarrantyRegistrationForm } from "@/components/WarrantyRegistrationForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLocale, getServerT } from "@/i18n/server";

export default async function WarrantyRegistrationPage() {
  const locale = await getLocale();
  const t = await getServerT(locale);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-page px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("warranty.currentLabel")} />

        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{t("warranty.title")}</h1>
          <p className="mt-4 text-sm leading-6 text-ikea-muted">{t("warranty.intro")}</p>
          <WarrantyRegistrationForm />
        </div>
      </div>
    </SiteLayout>
  );
}
