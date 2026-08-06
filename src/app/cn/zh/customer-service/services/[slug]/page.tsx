import { notFound } from "next/navigation";
import { findContentPage, pagesByFamily } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesByFamily("services").map((page) => ({
    slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = findContentPage(`/cn/zh/customer-service/services/${slug}/`);
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="客户服务" parentHref="/cn/zh/landing-page/cn--zh--9bdb3af1c07611e8affa0d09be91682d" />
    </SiteLayout>
  );
}
