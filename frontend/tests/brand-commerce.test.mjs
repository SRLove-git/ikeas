import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"))
}

test("brand commerce snapshot matches the 223 frontend source products", () => {
  const source = [
    ...readJson("frontend/src/data/midea/products.json"),
    ...readJson("frontend/src/data/toshiba/products.json"),
  ]
  const snapshot = readJson("backend/src/main/resources/data/products/products-brands.json")

  assert.equal(source.length, 223)
  assert.equal(snapshot.length, source.length)
  assert.equal(new Set(snapshot.map((product) => product.id)).size, source.length)
  assert.equal(new Set(snapshot.map((product) => product.slug)).size, source.length)

  const byId = new Map(snapshot.map((product) => [product.id, product]))
  for (const product of source) {
    const exported = byId.get(product.id)
    assert.ok(exported, `missing backend product ${product.id}`)
    assert.equal(exported.slug, product.slug)
    assert.equal(exported.price, product.price)
    assert.equal(exported.image, product.image)
    assert.ok(exported.price > 0, `${product.id} does not have a sale price`)
  }
})
