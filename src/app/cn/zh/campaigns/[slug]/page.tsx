import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("campaigns").map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/campaigns/${slug}`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="活动和特惠" parentHref="/cn/zh/personalize-channel/LimitedTimeDiscountsChannel" />
    </SiteLayout>
  );
}
