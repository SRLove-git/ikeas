import assert from "node:assert/strict"
import test from "node:test"
import {
  catalogPageSeoSlug,
  syncProductInCatalog,
  syncProductInCatalogPages,
  syncProductList,
} from "../src/lib/product-sync.ts"

const updated = {
  id: "sku-1",
  slug: "updated-product-sku-1",
  name: "更新后商品",
  productType: "检测试剂",
  designText: null,
  price: 0.01,
  originalPrice: 3.2,
  image: "/updated.png",
  labels: [{ text: "新品" }],
  detail: { images: ["/updated-1.png"], description: "更新后描述" },
}

test("base catalog copies receive the complete saved product", () => {
  const catalog = {
    catalogCategories: [
      {
        products: [
          { id: "sku-1", slug: "old-product-sku-1", name: "旧商品", price: 4.8 },
          { id: "sku-2", slug: "untouched-sku-2", name: "不变" },
        ],
      },
    ],
  }

  assert.equal(syncProductInCatalog(catalog, updated, { existingIdOrSlug: "sku-1" }), 1)
  assert.deepEqual(catalog.catalogCategories[0].products[0], updated)
  assert.equal(catalog.catalogCategories[0].products[1].name, "不变")
})

test("localized copies keep translations but receive price, media and slug", () => {
  const products = [
    {
      id: "sku-1",
      slug: "old-product-sku-1",
      name: "Translated name",
      productType: "Translated type",
      price: 4.8,
      image: "/old.png",
      detail: { images: ["/old-1.png"], description: "Translated description" },
    },
  ]

  assert.equal(syncProductList(products, updated, { localized: true }), 1)
  assert.equal(products[0].name, "Translated name")
  assert.equal(products[0].productType, "Translated type")
  assert.equal(products[0].detail.description, "Translated description")
  assert.equal(products[0].slug, updated.slug)
  assert.equal(products[0].price, 0.01)
  assert.equal(products[0].image, "/updated.png")
  assert.deepEqual(products[0].detail.images, ["/updated-1.png"])
})

test("catalog landing-page cards update without replacing translated copy", () => {
  const basePages = [
    {
      products: [
        {
          id: "sku-1",
          name: "旧商品",
          productType: "旧类型",
          designText: "旧设计",
          price: 4.8,
          image: "/old.png",
          seoSlug: "old-product",
        },
      ],
    },
  ]
  const localizedPages = structuredClone(basePages)
  localizedPages[0].products[0].name = "Translated name"
  localizedPages[0].products[0].productType = "Translated type"

  assert.equal(syncProductInCatalogPages(basePages, updated), 1)
  assert.equal(basePages[0].products[0].name, updated.name)
  assert.equal(basePages[0].products[0].price, 0.01)
  assert.equal(basePages[0].products[0].seoSlug, "updated-product")

  assert.equal(syncProductInCatalogPages(localizedPages, updated, { localized: true }), 1)
  assert.equal(localizedPages[0].products[0].name, "Translated name")
  assert.equal(localizedPages[0].products[0].productType, "Translated type")
  assert.equal(localizedPages[0].products[0].price, 0.01)
  assert.equal(localizedPages[0].products[0].seoSlug, "updated-product")
})

test("SEO slug only removes the exact product-id suffix", () => {
  assert.equal(catalogPageSeoSlug(updated), "updated-product")
  assert.equal(catalogPageSeoSlug({ id: "sku-1", slug: "custom-slug" }), "custom-slug")
})
