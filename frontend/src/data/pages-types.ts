export interface ContentBlockLink {
  href: string;
  text: string;
}

export interface ContentBlockItem {
  title: string;
  text: string;
  image: string | null;
  href: string | null;
  icon?: string | null;
  backgroundColor?: string | null;
}

export interface ContentColumn {
  heading: string | null;
  text: string | null;
  image: string | null;
  href: string | null;
}

export interface ContentBlock {
  type: string;
  title: string | null;
  texts: string[];
  images: string[];
  links: ContentBlockLink[];
  items?: ContentBlockItem[];
  columns?: ContentColumn[];
  productIds?: string[];
  settings: Record<string, unknown> | null;
}

export interface ContentPageData {
  url: string;
  family: string;
  id: string | null;
  title: string;
  name: string | null;
  hero: string | null;
  subtitle?: string | null;
  blocks: ContentBlock[];
}

export interface CatalogPageProduct {
  id: string;
  name: string;
  price: number | null;
  image: string | null;
  productType: string | null;
  designText: string | null;
  measureText: string | null;
  url: string | null;
  seoSlug: string | null;
}

export interface CatalogPageData {
  url: string;
  id: string | null;
  name: string;
  description: string | null;
  total: number;
  products: CatalogPageProduct[];
  blocks: ContentBlock[];
  productIds: string[];
}

export interface ProductDetailData {
  images: string[];
  benefits: string[];
  dimension: string | null;
  materials: string[];
  care: string[];
  description: string | null;
}

export interface ProductData {
  id: string;
  slug: string;
  name: string;
  productType: string | null;
  designText: string | null;
  price: number | null;
  image: string | null;
  labels: { text: string; backgroundColor: string | null; textColor: string | null }[];
  detail: ProductDetailData;
}
