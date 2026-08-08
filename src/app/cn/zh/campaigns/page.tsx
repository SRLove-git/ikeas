import { notFound } from "next/navigation";
import { findContentPage } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export default async function CampaignsRootPage() {
  const page = findContentPage("/cn/zh/campaigns/");
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="活动和特惠" parentHref="/cn/zh/campaigns/" />
    </SiteLayout>
  );
}
