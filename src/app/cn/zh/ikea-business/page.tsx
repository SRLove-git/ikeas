import { notFound } from "next/navigation";
import { findContentPage } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export default async function BusinessPage() {
  const page = findContentPage("/cn/zh/ikea-business/");
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="宜家对公业务" parentHref="/cn/zh/ikea-business/" />
    </SiteLayout>
  );
}
