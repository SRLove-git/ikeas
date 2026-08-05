// Crawls ikea.cn catalog (category) pages and product detail pages into
// src/data/catalog.ts, and downloads product images into public/images/products/.
//
// Uses puppeteer-core with the system Chrome. Run: node scripts/crawl-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const productsDir = path.join(repoRoot, "public", "images", "products");

const API_BASE = "https://srv.app.ikea.cn";
const HEADERS = {
  "X-Client-Platform": "PcWeb",
  Referer: "https://www.ikea.cn/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

const PRODUCTS_PER_CATEGORY = 16;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function api(pathname, opts = {}) {
  const res = await fetch(API_BASE + pathname, { headers: HEADERS, ...opts });
  return res.json();
}

async function download(url, targetPath) {
  if (fs.existsSync(targetPath)) return;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buf);
  } catch {
    /* skip failed downloads */
  }
}

function localizeImage(url, name) {
  if (!url) return null;
  const ext = url.includes(".png") ? "png" : "jpg";
  return `/images/products/${name}.${ext}`;
}

async function main() {
  fs.mkdirSync(productsDir, { recursive: true });

  // 1. Category tree from the catalogs API
  const tree = await api("/content/v2/catalogs?lang=zh");
  const topCategories = tree.map((c) => ({
    id: String(c.id),
    name: c.name,
    url: c.url,
    image: c.productImageUrl || null,
    subs: (c.subCategories || []).map((s) => ({
      id: String(s.id),
      name: s.name,
      url: s.url,
      image: s.productImageUrl || null,
    })),
  }));
  console.log(`categories: ${topCategories.length}`);

  // 2. Launch browser to extract product ids from each category page payload
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--lang=zh-CN"],
  });

  const catalog = [];
  const productIds = new Set();

  for (const cat of topCategories) {
    let ids = [];
    try {
      const page = await browser.newPage();
      await page.goto(cat.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2500));
      ids = await page.evaluate(() => {
        const n = window.__NUXT__;
        if (!n) return [];
        const s = JSON.stringify(n);
        return [...new Set([...s.matchAll(/"productId":"(\d+)"/g)].map((m) => m[1]))];
      });
      await page.close();
    } catch (err) {
      console.error(`page fail ${cat.name}: ${err.message}`);
    }
    console.log(`${cat.name}: ${ids.length} product ids`);

    // 3. Fetch product summaries in batches
    const products = [];
    for (let i = 0; i < Math.min(ids.length, 32); i += 8) {
      const batch = ids.slice(i, i + 8);
      try {
        const data = await api(`/content/products?ids=${batch.join(",")}`);
        products.push(...data);
      } catch {
        /* skip */
      }
    }
    const kept = products.slice(0, PRODUCTS_PER_CATEGORY);
    kept.forEach((p) => productIds.add(String(p.id)));

    const slug = (url) => url.replace(/\/$/, "").split("/").pop();
    catalog.push({
      id: cat.id,
      name: cat.name,
      slug: slug(cat.url),
      url: cat.url,
      image: cat.image,
      subs: cat.subs.map((s) => ({ name: s.name, slug: slug(s.url), url: s.url, image: s.image })),
      products: kept.map((p) => ({
        id: String(p.id),
        slug: `${p.seoSlug}-${p.id}`,
        name: p.name,
        productType: p.productType,
        designText: p.designText,
        price: p.price?.regularPrice ?? null,
        image: p.image,
        labels: (p.labels || []).map((l) => ({
          text: l.text,
          backgroundColor: l.backgroundColor,
          textColor: l.textColor,
        })),
      })),
    });
  }

  await browser.close();

  // 4. Fetch product detail pages (batched, concurrent)
  const ids = [...productIds];
  console.log(`products: ${ids.length}, fetching details...`);
  const details = {};
  let done = 0;
  const queue = async (list, limit, fn) => {
    const workers = [];
    for (let i = 0; i < limit; i++) {
      workers.push(
        (async () => {
          while (list.length) {
            const item = list.shift();
            await fn(item);
          }
        })(),
      );
    }
    await Promise.all(workers);
  };
  await queue([...ids], 8, async (id) => {
    try {
      const d = await api(`/content/products/${id}?lang=zh`);
      const p = d.data || d;
      if (!p || !p.productId) return;
      details[id] = {
        images: (p.images || []).slice(0, 4).map((img) => img.url || img.fullUrl || img),
        benefits: (p.benefits || []).map((b) => (typeof b === "string" ? b : b.text || b.title)).filter(Boolean).slice(0, 6),
        dimension: (() => {
          const raw = p.dimensionFormatText || p.dimension || null;
          if (typeof raw === "string") return raw;
          if (Array.isArray(raw)) {
            const parts = raw
              .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                  return [item.first, item.second].filter(Boolean).join(" ");
                }
                return null;
              })
              .filter(Boolean);
            return parts.length > 0 ? parts.join("；") : null;
          }
          return null;
        })(),
        materials: (p.customerMaterialList || [])
          .map((m) => (typeof m === "string" ? m : m.text || m.name || m.materialText))
          .filter(Boolean)
          .slice(0, 8),
        care: (p.careInstructions || []).map((c) => (typeof c === "string" ? c : c.text || c.title)).filter(Boolean).slice(0, 4),
        description:
          typeof (p.productDesc || p.fullDescription) === "string"
            ? (p.productDesc || p.fullDescription)
            : null,
      };
    } catch {
      /* skip */
    }
    done++;
    if (done % 50 === 0) console.log(`  details ${done}/${ids.length}`);
  });

  // 5. Download images (main + up to 2 detail images per product)
  console.log("downloading images...");
  const imageJobs = [];
  for (const cat of catalog) {
    for (const p of cat.products) {
      const detail = details[p.id];
      const urls = [p.image, ...(detail?.images || []).slice(1, 3)].filter(Boolean);
      urls.forEach((url, idx) => {
        imageJobs.push({
          url: `${url.split("?")[0]}?x-oss-process=image/quality,q_80/interlace,1/resize,w_500`,
          target: path.join(productsDir, `${p.id}${idx === 0 ? "" : `-${idx}`}.${url.includes(".png") ? "png" : "jpg"}`),
        });
      });
    }
  }
  await queue(imageJobs, 6, async (job) => {
    await download(job.url, job.target);
  });
  console.log(`images: ${imageJobs.length}`);

  // 6. Generate src/data/catalog.ts
  const output = {
    categories: catalog.map((cat) => ({
      ...cat,
      image: cat.image
        ? `/images/categories/${cat.image.split("/").pop().split("?")[0].replace(/\.[a-z]+$/i, "")}.jpeg`
        : null,
      subs: cat.subs.map((s) => ({
        ...s,
        image: s.image
          ? `/images/categories/${s.image.split("/").pop().split("?")[0].replace(/\.[a-z]+$/i, "")}.jpeg`
          : null,
      })),
      products: cat.products.map((p) => ({
        ...p,
        image: localizeImage(p.image, p.id),
        detail: details[p.id]
          ? {
              ...details[p.id],
              images: (details[p.id].images || []).map((u, idx) => localizeImage(u, `${p.id}${idx === 0 ? "" : `-${idx}`}`)),
            }
          : null,
      })),
    })),
  };

  // Validate before writing
  const rawJson = JSON.stringify(output.categories, null, 1);
  JSON.parse(rawJson);
  fs.writeFileSync("/tmp/ikea-clone.VKMnXI/catalog-raw.json", rawJson);

  const lines = [
    "// Generated by scripts/crawl-catalog.mjs — do not hand-edit.",
    "export interface CatalogLabel {",
    "  text: string;",
    "  backgroundColor?: string;",
    "  textColor?: string;",
    "}",
    "",
    "export interface CatalogProduct {",
    "  id: string;",
    "  slug: string;",
    "  name: string;",
    "  productType?: string;",
    "  designText?: string;",
    "  price: number | null;",
    "  image: string | null;",
    "  labels: CatalogLabel[];",
    "  detail: {",
    "    images: (string | null)[];",
    "    benefits: string[];",
    "    dimension?: string | null;",
    "    materials: string[];",
    "    care: string[];",
    "    description?: string | null;",
    "  } | null;",
    "}",
    "",
    "export interface CatalogCategory {",
    "  id: string;",
    "  name: string;",
    "  slug: string;",
    "  url: string;",
    "  image: string | null;",
    "  subs: { name: string; slug: string; url: string; image: string | null }[];",
    "  products: CatalogProduct[];",
    "}",
    "",
    "export const catalogCategories: CatalogCategory[] = " + rawJson + ";",
    "",
  ];
  fs.writeFileSync(path.join(repoRoot, "src", "data", "catalog.ts"), lines.join("\n"));
  console.log("written src/data/catalog.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
