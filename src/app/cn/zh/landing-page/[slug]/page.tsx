import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("landing").map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/landing-page/${slug}`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} />
    </SiteLayout>
  );
}
