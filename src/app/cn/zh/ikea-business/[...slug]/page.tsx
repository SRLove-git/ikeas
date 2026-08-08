import { notFound } from "next/navigation";
import { findContentPage, pagesDeeper } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesDeeper("ikea-business", 1).map((page) => ({
    slug: page.url
      .replace("/cn/zh/ikea-business/", "")
      .replace(/\/+$/, "")
      .split("/"),
  }));
}

export default async function BusinessSubPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const url = `/cn/zh/ikea-business/${slug.join("/")}`;
  const page = findContentPage(url);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="宜家对公业务" parentHref="/cn/zh/ikea-business/" />
    </SiteLayout>
  );
}
