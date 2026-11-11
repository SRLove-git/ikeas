// Exports the frontend's crawled data (TS/JSON) into server/src/main/resources/data
// so the Spring Boot backend can serve it through its REST API.
//
// Usage: node scripts/export-server-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcData = path.join(root, "frontend", "src", "data");
const outRoot = path.join(root, "backend", "src", "main", "resources", "data");

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(
    `copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`,
  );
}

function writeJson(relOut, value) {
  const dest = path.join(outRoot, relOut);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(value));
  console.log(
    `exported -> ${path.relative(root, dest)} (${fs.statSync(dest).size} bytes)`,
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function brandProducts(brand, label) {
  const base = path.join(srcData, brand);
  const categories = readJson(path.join(base, "categories.json"));
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  return readJson(path.join(base, "products.json")).map((product) => {
    const category = categoryBySlug.get(product.categorySlug);
    const sub = category?.subs?.find((item) => item.slug === product.subSlug);
    const categoryNames = [label, category?.name, sub?.name].filter(Boolean);
    const images = (product.detail?.images ?? []).filter(Boolean);
    if (product.image && !images.includes(product.image))
      images.unshift(product.image);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      productType: `${label} · ${sub?.name ?? product.subSlug}`,
      designText: product.model,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      labels: product.labels ?? [],
      detail: {
        images,
        benefits: product.detail?.benefits ?? [],
        capacity: product.detail?.capacity ?? null,
        dimension: product.detail?.dimension ?? null,
        energy: product.detail?.energy ?? null,
        materials: product.detail?.materials ?? [],
        care: product.detail?.care ?? [],
        description: product.detail?.description ?? null,
      },
      categoryNames,
    };
  });
}

// Homepage / menu / category data now lives in JSON (CMS-managed); copy the
// files byte-for-byte instead of transpiling the TS modules.
copy(path.join(srcData, "homepage.json"), path.join(outRoot, "homepage.json"));
copy(
  path.join(srcData, "menu-panels.json"),
  path.join(outRoot, "menu-panels.json"),
);
copy(
  path.join(srcData, "menu-categories.json"),
  path.join(outRoot, "menu-categories.json"),
);
copy(path.join(srcData, "catalog.json"), path.join(outRoot, "catalog.json"));
copy(
  path.join(srcData, "chat-knowledge.json"),
  path.join(outRoot, "chat-knowledge.json"),
);
// Legacy content pages were removed with the IKEA content cleanup.
writeJson("legacy-pages.json", { contentPages: [] });

// Raw crawled JSON stays byte-for-byte identical.
copy(
  path.join(srcData, "catalog-pages", "all.json"),
  path.join(outRoot, "catalog-pages.json"),
);

for (const name of fs
  .readdirSync(path.join(srcData, "pages"))
  .filter((f) => f.endsWith(".json"))) {
  copy(path.join(srcData, "pages", name), path.join(outRoot, "pages", name));
}
for (const name of fs
  .readdirSync(path.join(srcData, "products"))
  .filter((f) => f.endsWith(".json"))) {
  copy(
    path.join(srcData, "products", name),
    path.join(outRoot, "products", name),
  );
}

// Brand catalogues use their own richer source schema in the frontend. Export
// a normalized commerce snapshot so carts, orders, OMS validation and support
// search resolve the exact same product IDs as the storefront.
writeJson("products/products-brands.json", [
  ...brandProducts("midea", "美的 Midea"),
  ...brandProducts("toshiba", "东芝 Toshiba"),
]);

console.log("Done.");
