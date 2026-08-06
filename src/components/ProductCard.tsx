import Link from "next/link";
import type { CatalogProduct } from "@/data/catalog";
import { formatPrice } from "@/lib/catalog";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const spec = [product.productType, product.designText].filter(Boolean).join(", ");

  return (
    <Link
      href={`/cn/zh/p/${product.slug}`}
      className="group flex flex-col"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ikea-gray-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ikea-gray-100" />
        )}
      </div>
      <div className="flex flex-col pt-3">
        {product.labels.length > 0 ? (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {product.labels.map((label) => (
              <span
                key={label.text}
                className="inline-block px-1.5 py-0.5 text-[10px] font-bold leading-[10px]"
                style={{
                  backgroundColor: label.backgroundColor ?? "#111111",
                  color: label.textColor ?? "#ffffff",
                }}
              >
                {label.text}
              </span>
            ))}
          </div>
        ) : null}
        <h3 className="text-sm font-bold leading-[18px] text-ikea-black">
          {product.name}
        </h3>
        {spec ? (
          <p className="mt-0.5 text-xs leading-[18px] text-ikea-muted">{spec}</p>
        ) : null}
        <p className="mt-1.5 text-sm text-ikea-black">
          {formatPrice(product.price)}
          {product.originalPrice != null ? (
            <span className="ml-2 text-xs text-ikea-muted line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
