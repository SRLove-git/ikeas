import type { ProductData } from "./pages-types";
import part1 from "./products/products-part-1.json";
import part2 from "./products/products-part-2.json";
import part3 from "./products/products-part-3.json";
import part4 from "./products/products-part-4.json";
import part5 from "./products/products-part-5.json";
import part6 from "./products/products-part-6.json";

export const allProducts: ProductData[] = [
  ...(part1 as unknown as ProductData[]),
  ...(part2 as unknown as ProductData[]),
  ...(part3 as unknown as ProductData[]),
  ...(part4 as unknown as ProductData[]),
  ...(part5 as unknown as ProductData[]),
  ...(part6 as unknown as ProductData[]),
];

export const productsBySlug = new Map(
  allProducts.map((product) => [product.slug, product]),
);

export const productsById = new Map(
  allProducts.map((product) => [product.id, product]),
);
