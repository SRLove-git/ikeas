import { notFound } from "next/navigation";
import { findContentPage, pagesAtDepth } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesAtDepth("new", 2).map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function NewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/new/${slug}`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="新品" parentHref="/cn/zh/personalize-channel/NewArrivalsChannel" />
    </SiteLayout>
  );
}
