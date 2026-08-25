import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLocale, getServerT } from "@/i18n/server";

export default async function ComparePage() {
  const locale = await getLocale();
  const t = await getServerT(locale);
  const items = allProducts(locale).slice(0, 3);
  const rows: [string, (p: (typeof items)[number]) => string][] = [
    [t("common.price"), (p) => formatPrice(p.price)],
    [t("common.type"), (p) => p.productType ?? "—"],
    [t("common.design"), (p) => p.designText ?? "—"],
    [t("common.dimension"), (p) => p.detail.dimension ?? "—"],
    [t("common.materials"), (p) => p.detail.materials[0] ?? "—"],
    [t("common.care"), (p) => p.detail.care[0] ?? "—"],
  ];

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <Breadcrumbs currentLabel={t("compare.currentLabel")} />

          <h1 className="text-2xl font-bold leading-9">{t("compare.title")}</h1>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border border-ikea-gray-200 bg-ikea-gray-100 p-4 text-left font-bold">
                    {t("common.product")}
                  </th>
                  {items.map((product) => (
                    <th key={product.id} className="border border-ikea-gray-200 p-4">
                      <Link href={`/cn/zh/p/${product.slug}/`} className="group">
                        <SiteImage
                          src={product.image}
                          alt={product.name}
                          className="aspect-square w-full bg-white"
                          imgClassName="h-full w-full object-contain object-[50%_20%]"
                        />
                        <span className="mt-2 block text-center text-sm font-bold group-hover:underline">
                          {product.name}
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label}>
                    <td className="border border-ikea-gray-200 bg-ikea-gray-100 p-4 font-bold">
                      {label}
                    </td>
                    {items.map((product) => (
                      <td key={product.id} className="border border-ikea-gray-200 p-4 text-center">
                        {get(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
