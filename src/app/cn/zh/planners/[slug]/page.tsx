import { notFound } from "next/navigation";
import { findContentPage, pagesAtDepth } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesAtDepth("planners", 2).map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function PlannerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/planners/${slug}/`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="设计和服务" parentHref="/cn/zh/planners/" />
    </SiteLayout>
  );
}
