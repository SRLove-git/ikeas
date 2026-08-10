import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";

export default function ComparePage() {
  const items = allProducts().slice(0, 3);
  const rows: [string, (p: (typeof items)[number]) => string][] = [
    ["价格", (p) => formatPrice(p.price)],
    ["类型", (p) => p.productType ?? "—"],
    ["设计", (p) => p.designText ?? "—"],
    ["尺寸", (p) => p.detail.dimension ?? "—"],
    ["材质", (p) => p.detail.materials[0] ?? "—"],
    ["保养", (p) => p.detail.care[0] ?? "—"],
  ];

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <span className="text-ikea-black">商品对比</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9">商品对比</h1>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border border-ikea-gray-200 bg-ikea-gray-100 p-4 text-left font-bold">
                    商品
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
