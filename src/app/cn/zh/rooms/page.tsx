import { notFound } from "next/navigation";
import { findContentPage } from "@/lib/pages";
import { ContentPage } from "@/components/ContentPage";
import { SiteLayout } from "@/components/SiteLayout";

export default async function RoomsRootPage() {
  const page = findContentPage("/cn/zh/rooms/");
  if (!page) notFound();

  return (
    <SiteLayout>
      <ContentPage page={page} />
    </SiteLayout>
  );
}
