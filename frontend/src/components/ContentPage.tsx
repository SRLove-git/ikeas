import { ContentBlocks } from "@/components/ContentBlocks";
import { SiteImage } from "@/components/SiteImage";
import type { ContentPageData } from "@/data/pages-types";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface ContentPageProps {
  page: ContentPageData;
}

export function ContentPage({ page }: ContentPageProps) {
  const title = page.title || page.name || "未命名页面";

  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <Breadcrumbs currentLabel={title} />

        {page.subtitle ? (
          <header className="-mx-5 flex min-h-[260px] items-center bg-ikea-blue px-5 py-12 text-white lg:-mx-10">
            <div className="mx-auto w-full max-w-3xl text-center">
              <h1 className="text-2xl font-bold leading-9 lg:text-4xl lg:leading-[3rem]">
                {title}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80">
                {page.subtitle}
              </p>
            </div>
          </header>
        ) : (
          <h1 className="text-center text-2xl font-bold leading-9 lg:text-3xl">{title}</h1>
        )}

        {page.hero ? (
          <div className="mt-6">
            <SiteImage
              src={page.hero}
              alt={title}
              className="w-full max-h-[480px]"
            />
          </div>
        ) : null}

        {page.blocks.length > 0 ? (
          <div className="mt-10">
            <ContentBlocks blocks={page.blocks} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
