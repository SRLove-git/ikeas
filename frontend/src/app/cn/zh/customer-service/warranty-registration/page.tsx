import { SiteLayout } from "@/components/SiteLayout";
import { WarrantyRegistrationForm } from "@/components/WarrantyRegistrationForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function WarrantyRegistrationPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-page px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel="保修注册" />

        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">保修注册</h1>
          <p className="mt-4 text-sm leading-6 text-ikea-muted">
            登记您的 BUZUD 产品信息，即可享受官方质保服务。提交后请妥善保管发票，维修或换货时需一并提供。
          </p>
          <WarrantyRegistrationForm />
        </div>
      </div>
    </SiteLayout>
  );
}
