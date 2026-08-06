import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("rooms").map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/rooms/${slug}/`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="房间" parentHref="/cn/zh/rooms/living-room/" />
    </SiteLayout>
  );
}
