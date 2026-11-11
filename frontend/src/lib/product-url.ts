export function productHref(product: { id?: string | null; slug: string }): string {
  if (product.id?.startsWith("midea-")) {
    return `/zh/midea/p/${product.slug}/`
  }
  if (product.id?.startsWith("toshiba-")) {
    return `/zh/toshiba/p/${product.slug}/`
  }
  return `/zh/p/${product.slug}/`
}
