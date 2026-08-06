import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("galleries").map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-2) ?? "",
  }));
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/rooms/${slug}/gallery/`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="房间灵感" parentHref="/cn/zh/ideas/rooms-inspiration/" />
    </SiteLayout>
  );
}
