import Link from "next/link";
import { catalogData } from "@/data/catalog";
import { catalogPages } from "@/lib/catalog-pages";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteLayout } from "@/components/SiteLayout";
import { getLocale, getServerT } from "@/i18n/server";

export default async function AllProductsPage() {
  const locale = await getLocale();
  const t = await getServerT(locale);
  const { catalogCategories } = catalogData(locale);
  const allCategories = [
    ...catalogCategories.map((category) => ({
      name: category.name,
      href: `/cn/zh/cat/${category.slug}`,
      image: category.image,
      count: category.products.length,
    })),
    ...catalogPages(locale)
      .filter(
        (page) =>
          !catalogCategories.some(
            (category) => category.slug === page.url.split("/").filter(Boolean).at(-1),
          ),
      )
      .map((page) => ({
        name: page.name,
        href: page.url,
        image: page.products[0]?.image ?? null,
        count: page.total,
      })),
  ];
  // Guard against category/page URL collisions (same slug in both stores).
  const uniqueCategories = [...new Map(allCategories.map((c) => [c.href, c])).values()];

  return (
    <SiteLayout>
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <Breadcrumbs currentLabel={t("allProducts.currentLabel")} />
        <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{t("allProducts.title")}</h1>

        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {uniqueCategories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-contain object-center p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-ikea-gray-100" />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold">{category.name}</span>
                <span className="text-xs text-ikea-muted">
                  {t("common.items", { count: category.count })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
