import { notFound } from "next/navigation";
import { findContentPage, pagesAtDepth } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesAtDepth("ideas", 2).map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/ideas/${slug}/`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="家居灵感" parentHref="/cn/zh/ideas/rooms-inspiration/" />
    </SiteLayout>
  );
}
