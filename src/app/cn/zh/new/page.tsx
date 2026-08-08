import { notFound } from "next/navigation";
import { findContentPage } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export default async function NewRootPage() {
  const page = findContentPage("/cn/zh/new/");
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} parentLabel="新品" parentHref="/cn/zh/new/" />
    </SiteLayout>
  );
}
