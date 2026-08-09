// Client-safe formatting helpers (no data imports), so interactive components
// can format prices without pulling the server-side content store into the
// client bundle.

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return "";
  return `SGD ${price.toLocaleString("zh-CN", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getCollectionHref(category: {
  slug: string;
  url: string;
}): string {
  if (category.url.startsWith("/cn/zh/personalize-channel/")) {
    return category.url;
  }
  return `/cn/zh/cat/${category.slug}`;
}
