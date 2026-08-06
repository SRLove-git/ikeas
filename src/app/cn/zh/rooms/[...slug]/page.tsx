import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("rooms-articles").map((page) => ({
    slug: page.url
      .replace("/cn/zh/rooms/", "")
      .replace(/\/+$/, "")
      .split("/"),
  }));
}

export default async function RoomArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const url = `/cn/zh/rooms/${slug.join("/")}`;
  const page = findContentPage(url);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="房间灵感" parentHref="/cn/zh/ideas/rooms-inspiration/" />
    </SiteLayout>
  );
}
