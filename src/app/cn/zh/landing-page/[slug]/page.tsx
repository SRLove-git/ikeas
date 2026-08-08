import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const page of [...pagesByFamily("landing"), ...pagesByFamily("landing-page")]) {
    slugs.add(page.url.split("/").filter(Boolean).at(-1) ?? "");
  }
  return [...slugs].map((slug) => ({ slug }));
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
