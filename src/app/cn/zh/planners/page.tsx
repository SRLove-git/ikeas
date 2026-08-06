import { notFound } from "next/navigation";
import { findContentPage } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export default async function PlannersPage() {
  const page = findContentPage("/cn/zh/planners/");
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="设计和服务" parentHref="/cn/zh/planners/" />
    </SiteLayout>
  );
}
