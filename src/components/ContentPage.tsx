import Link from "next/link";
import type { ContentPageData } from "@/data/pages";
import { familyLabel } from "@/lib/pages";

interface ContentPageProps {
  page: ContentPageData;
  parentLabel?: string;
  parentHref?: string;
}

export function ContentPage({
  page,
  parentLabel,
  parentHref,
}: ContentPageProps) {
  const title = page.h1 || page.title;
  const label = parentLabel ?? familyLabel(page.family);
  const href = parentHref ?? "/";

  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <Link href={href} className="hover:text-ikea-black">
            {label}
          </Link>
          <span>/</span>
          <span className="text-ikea-black">{title}</span>
        </nav>

        <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{title}</h1>

        {page.hero ? (
          <div className="mt-6 overflow-hidden bg-ikea-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.hero} alt={title} className="max-h-[480px] w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-10 space-y-12">
          {page.sections.map((section, index) => (
            <section
              key={`${section.heading}-${index}`}
              className={`flex flex-col gap-6 ${
                section.image ? "md:flex-row md:items-center" : ""
              }`}
            >
              {section.image ? (
                <div
                  className={`w-full overflow-hidden bg-ikea-gray-100 md:w-1/2 ${
                    index % 2 === 1 ? "md:order-2" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.image}
                    alt={section.heading}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              ) : null}
              <div className={section.image ? "md:w-1/2" : ""}>
                {section.heading ? (
                  <h2 className="text-xl font-bold leading-8">{section.heading}</h2>
                ) : null}
                {section.text ? (
                  <p className="mt-3 text-sm leading-6 text-ikea-muted">
                    {section.text}
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        {page.links.length > 0 ? (
          <div className="mt-14 border-t border-ikea-gray-200 pt-8">
            <h2 className="mb-4 text-base font-bold">相关链接</h2>
            <div className="flex flex-wrap gap-2">
              {page.links.slice(0, 12).map((link) => (
                <Link
                  key={link}
                  href={link}
                  className="i-pill i-pill--small"
                >
                  {link.split("/").filter(Boolean).slice(-1)[0] || "查看"}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
