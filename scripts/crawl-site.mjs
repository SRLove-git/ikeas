// Full-site crawler for ikea.cn — content pages (CMS), category pages (cat),
// planner pages, and product pages. Parses the server-rendered Nuxt payload
// embedded in every page's HTML, so no browser is required.
//
// Usage:
//   node scripts/crawl-site.mjs --content   # CMS + cat + planners pages
//   node scripts/crawl-site.mjs --products  # all product details via API
//   node scripts/crawl-site.mjs --finalize  # aggregate already-crawled data
//   node scripts/crawl-site.mjs --links <json>  # crawl an explicit URL list
//
// Outputs:
//   docs/research/data/pages/<safe>.json      raw normalized page payloads
//   docs/research/data/products/<id>.json     raw product payloads
//   src/data/pages/<family>.json              aggregated content pages
//   src/data/products-part-*.json             aggregated product data
// Images are NOT downloaded by default — data keeps the original CDN URLs and
// the frontend renders placeholders when they are unavailable.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const SITEMAP_DIR = "/tmp/ikea-sitemaps";

const SITEMAP_INDEX =
  "https://www.ikea.cn/sitemaps/sitemap.xml";
const API_BASE = "https://srv.app.ikea.cn";
const SITE = "https://www.ikea.cn";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
};
const CONCURRENCY = 8;
const RETRIES = 2;
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;

// ---------------------------------------------------------------- helpers

function safeName(url) {
  return url
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");
}

function familyOf(url) {
  const parts = url.split("/").filter(Boolean);
  return parts[2] ?? "root";
}

async function fetchWithRetry(url, options = {}, retries = RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      return res;
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return null;
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item === undefined) break;
      try {
        await fn(item);
      } catch (err) {
        console.error("worker error:", err.message);
      }
    }
  });
  await Promise.all(workers);
}

// ------------------------------------------------------- Nuxt payload parse

function parseNuxtPayload(payload) {
  const val = (i) => {
    if (typeof i === "number" && Number.isInteger(i) && i >= 0 && i < payload.length) {
      const item = payload[i];
      if (Array.isArray(item) && item.length >= 2 && typeof item[0] === "string") {
        const t = item[0];
        if (
          ["string", "number", "boolean", "null", "undefined", "Date", "BigInt"].includes(t)
        ) {
          return item.length > 1 ? item[1] : undefined;
        }
        if (t === "object") {
          const out = {};
          for (const [k, ref] of item[1]) out[val(k)] = val(ref);
          return out;
        }
        if (t === "Set") return item[1].map((x) => val(x));
        return item.slice(1).map((x) => val(x));
      }
      if (Array.isArray(item)) return item.map((x) => val(x));
      if (item !== null && typeof item === "object") {
        const out = {};
        for (const k of Object.keys(item)) out[k] = val(item[k]);
        return out;
      }
      return item;
    }
    return i;
  };
  return val(payload[0][1]);
}

async function fetchPagePayload(url) {
  const withSlash = url.endsWith("/") ? url : `${url}/`;
  const res = await fetchWithRetry(SITE + withSlash, { headers: HEADERS });
  if (!res) return null;
  const html = await res.text();
  const m = html.match(
    /<script type="application\/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">(.*?)<\/script>/s,
  );
  if (!m) return null;
  try {
    return { html, root: parseNuxtPayload(JSON.parse(m[1])) };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------- extraction

const IMG_EXT = /\.(jpe?g|png|webp|svg|gif|avif|bmp)(\?|$)/i;

function walkModel(model) {
  const texts = [];
  const images = [];
  const links = [];
  const seen = new Set();
  const depthCap = 8;

  const walk = (node, key, depth) => {
    if (node === null || node === undefined || depth > depthCap) return;
    if (typeof node === "string") {
      const s = node.trim();
      if (!s || seen.has(s)) return;
      if (/^https?:\/\//.test(s) && (IMG_EXT.test(s) || /image/i.test(key))) {
        seen.add(s);
        images.push(s);
      } else if (s.length >= 2 && texts.length < 10) {
        seen.add(s);
        texts.push(s.slice(0, 600));
      }
      return;
    }
    if (Array.isArray(node)) {
      node.slice(0, 40).forEach((child) => walk(child, key, depth + 1));
      return;
    }
    if (typeof node === "object") {
      const href =
        typeof node.url === "string"
          ? node.url
          : typeof node.href === "string"
            ? node.href
            : typeof node.linkUrl === "string"
              ? node.linkUrl
              : null;
      const label = [node.text, node.title, node.name, node.label]
        .find((v) => typeof v === "string" && v.trim().length > 0);
      if (href && (href.startsWith("/") || href.startsWith("http"))) {
        if (label && links.length < 8) links.push({ href, text: label.slice(0, 120) });
        else if (links.length < 8) links.push({ href, text: "" });
      }
      for (const [k, v] of Object.entries(node)) {
        if (v === null || v === undefined) continue;
        if (Array.isArray(v) && v.length > 40) {
          // sample large lists (product grids etc.)
          v.slice(0, 40).forEach((c) => walk(c, k, depth + 1));
        } else {
          walk(v, k, depth + 1);
        }
      }
    }
  };
  walk(model, "", 0);
  return { texts, images, links };
}

function extractBlock(comp) {
  const { type, settings, model } = comp;
  const m = model ?? {};
  const title =
    typeof m.title === "string"
      ? m.title
      : typeof m.name === "string"
        ? m.name
        : typeof m.heading === "string"
          ? m.heading
          : null;
  const { texts, images, links } = walkModel(m);
  const items = extractBlockItems(m);
  return {
    type,
    title: title ? title.slice(0, 200) : null,
    texts: texts.slice(0, 6),
    images: images.slice(0, 5),
    links: links.slice(0, 6),
    items: items.slice(0, 24),
    settings: settings && Object.keys(settings).length ? settings : null,
  };
}

function normalizeHref(url) {
  if (!url || typeof url !== "string") return null;
  if (/^ikea:\/\//.test(url)) return null;
  if (/^https?:\/\//.test(url)) {
    const m = url.match(/^https?:\/\/www\.ikea\.cn(\/.*)/);
    return m ? m[1] : url;
  }
  if (url.startsWith("/")) {
    return url.startsWith("/cn/") ? url : `/cn/zh${url}`;
  }
  return null;
}

/** Collect paired image/title/link items from a component model. */
function extractBlockItems(model) {
  const items = [];
  const seen = new Set();
  const walk = (node, depth) => {
    if (!node || typeof node !== "object" || depth > 7) return;
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, depth + 1));
      return;
    }
    const linkUrl =
      typeof node.link === "string"
        ? node.link
        : typeof node.link?.url === "string"
          ? node.link.url
          : typeof node.href === "string"
            ? node.href
            : null;
    const imageUrl =
      typeof node.image === "string"
        ? node.image
        : typeof node.image?.url === "string"
          ? node.image.url
          : null;
    const title =
      [node.title, node.subtitle, node.textBoxHeader, node.alt, node.name]
        .find(
          (v) =>
            typeof v === "string" && v.trim().length > 0 && v.trim() !== "名称",
        ) ?? "";
    if ((linkUrl || imageUrl) && (title || imageUrl)) {
      const href = normalizeHref(linkUrl);
      const item = {
        title: String(title).slice(0, 200),
        text:
          (typeof node.subtitle === "string"
            ? node.subtitle
            : typeof node.description === "string"
              ? node.description
              : "")?.slice(0, 300) ?? "",
        image: imageUrl,
        href,
        backgroundColor:
          typeof node.backgroundColor === "string" ? node.backgroundColor : null,
      };
      const key = `${item.image}|${item.href}|${item.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
      return;
    }
    for (const value of Object.values(node)) {
      walk(value, depth + 1);
    }
  };
  walk(model, 0);
  return items;
}

function extractContentPage(root, url) {
  const dataArr = root.data ?? [];
  const data = dataArr[0] ?? dataArr;
  const dataKeys = typeof data === "object" && data ? Object.keys(data) : [];
  const contentKey =
    dataKeys.find((k) => data[k] && (data[k].content || data[k].components)) ??
    dataKeys[0] ??
    null;
  const page = contentKey ? data[contentKey] : null;
  const content = page?.content ?? {};
  const components = Array.isArray(content.components) ? content.components : [];
  const blocks = components.map(extractBlock).filter((b) => b.type);

  const title =
    typeof content.title === "string" && content.title
      ? content.title
      : typeof content.name === "string" && content.name
        ? content.name
        : "";
  const model = content.model ?? {};
  const hero =
    (typeof model.poster === "string" && model.poster) ||
    (typeof model.previewImage === "string" && model.previewImage) ||
    null;

  return {
    url,
    family: familyOf(url),
    id: content.id ?? null,
    title,
    name: typeof content.name === "string" ? content.name : null,
    hero,
    blocks,
  };
}

function extractCatalogPage(root, url) {
  const dataArr = root.data ?? [];
  const data = dataArr[0] ?? dataArr;
  const dataKeys = typeof data === "object" && data ? Object.keys(data) : [];
  const contentKey =
    dataKeys.find((k) => data[k] && (data[k].content || data[k].components)) ??
    dataKeys[0] ??
    null;
  const page = contentKey ? data[contentKey] : null;
  const content = page?.content ?? {};
  const products = content.products ?? {};
  const summaries = Array.isArray(products.productSummaries)
    ? products.productSummaries
    : [];
  const ids = Array.isArray(products.productIds) ? products.productIds : [];
  const seo = content.seoInfo ?? null;
  const fragments = Array.isArray(content.fragments) ? content.fragments : [];
  const blocks = fragments
    .map((f) => (f && f.type ? extractBlock(f) : null))
    .filter(Boolean);

  const title =
    (typeof seo?.pageTitle === "string" && seo.pageTitle) ||
    (typeof seo?.title === "string" && seo.title) ||
    (typeof content.name === "string" && content.name) ||
    "";
  const description =
    (typeof seo?.description === "string" && seo.description) || null;

  return {
    url,
    id: familyOf(url) === "cat" ? url.split("/").filter(Boolean).at(-1) : null,
    name: title,
    description,
    total: products.total ?? summaries.length,
    products: summaries.slice(0, 60).map((p) => ({
      id: String(p.id ?? p.productId ?? ""),
      name: p.name ?? "",
      price: p.price?.regularPrice ?? p.price ?? null,
      image: p.image ?? p.productImageUrl ?? null,
      productType: p.productType ?? null,
      designText: p.designText ?? null,
      measureText: p.measureText ?? null,
      url: p.url ?? null,
      seoSlug: p.seoSlug ?? null,
    })),
    blocks,
    productIds: ids.slice(0, 200),
  };
}

// ------------------------------------------------------------------ crawl

async function getSitemapUrls() {
  const out = new Set();
  fs.mkdirSync(SITEMAP_DIR, { recursive: true });
  const indexRes = await fetchWithRetry(SITEMAP_INDEX, { headers: HEADERS });
  if (!indexRes) throw new Error("sitemap index fetch failed");
  const indexXml = await indexRes.text();
  const subs = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const zhSubs = subs.filter((s) => /zh-CN/.test(s) && !/en-CN/.test(s));
  for (const sub of zhSubs) {
    const file = path.join(SITEMAP_DIR, sub.split("/").pop());
    if (!fs.existsSync(file)) {
      const res = await fetchWithRetry(sub, { headers: HEADERS });
      if (res) fs.writeFileSync(file, await res.text());
    }
    const xml = fs.readFileSync(file, "utf8");
    for (const loc of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      out.add(loc[1].replace(SITE, "").replace(/\/$/, "") || "/");
    }
  }
  return [...out];
}

function isContentUrl(u) {
  return !u.startsWith("/cn/zh/p/") && !u.startsWith("/cn/zh/cat/") && !u.startsWith("/cn/zh/planners/");
}

async function crawlContent() {
  const urls = await getSitemapUrls();
  const contentUrls = urls.filter(isContentUrl);
  const catUrls = urls.filter((u) => u.startsWith("/cn/zh/cat/"));
  const plannerUrls = urls.filter((u) => u.startsWith("/cn/zh/planners/"));
  console.log(
    `content=${contentUrls.length} cat=${catUrls.length} planners=${plannerUrls.length}`,
  );

  const pagesDir = path.join(repoRoot, "docs", "research", "data", "pages");
  fs.mkdirSync(pagesDir, { recursive: true });

  const allUrls = [...contentUrls, ...plannerUrls];
  const targets = LIMIT ? allUrls.slice(0, LIMIT) : allUrls;
  let done = 0;
  await mapLimit(targets, CONCURRENCY, async (url) => {
    const data = await fetchPagePayload(url);
    let page = null;
    if (data) {
      page = extractContentPage(data.root, url);
      if (page.blocks.length === 0 && !page.title) page = null;
    }
    if (page) {
      fs.writeFileSync(
        path.join(pagesDir, safeName(url) + ".json"),
        JSON.stringify(page, null, 1),
      );
    }
    done++;
    if (done % 250 === 0) console.log(`  content ${done}/${targets.length}`);
  });
  console.log("content pages done:", done);

  const catDir = path.join(repoRoot, "docs", "research", "data", "catalog");
  fs.mkdirSync(catDir, { recursive: true });
  const catTargets = LIMIT ? catUrls.slice(0, LIMIT) : catUrls;
  let catDone = 0;
  await mapLimit(catTargets, CONCURRENCY, async (url) => {
    const data = await fetchPagePayload(url);
    if (data) {
      const page = extractCatalogPage(data.root, url);
      if (page.name || page.products.length) {
        fs.writeFileSync(
          path.join(catDir, safeName(url) + ".json"),
          JSON.stringify(page, null, 1),
        );
      }
    }
    catDone++;
    if (catDone % 200 === 0) console.log(`  cat ${catDone}/${catTargets.length}`);
  });
  console.log("cat pages done:", catDone);
}

// ------------------------------------------------------- crawl missing URLs

async function crawlGaps() {
  const aliveFile = path.join(repoRoot, "docs", "research", "data", "gaps-alive.json");
  const missingFile = path.join(repoRoot, "docs", "research", "data", "coverage-missing.json");
  const alive = fs.existsSync(aliveFile) ? JSON.parse(fs.readFileSync(aliveFile, "utf8")) : null;
  if (!alive && !fs.existsSync(missingFile)) {
    console.log("no gap lists — run scripts/classify-missing.mjs first");
    return;
  }
  const missing = alive
    ? { targeted: alive }
    : JSON.parse(fs.readFileSync(missingFile, "utf8"));

  const pagesDir = path.join(repoRoot, "docs", "research", "data", "pages");
  const catDir = path.join(repoRoot, "docs", "research", "data", "catalog");
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(catDir, { recursive: true });

  const contentTargets = [];
  const catTargets = [];
  for (const [fam, urls] of Object.entries(missing)) {
    if (fam === "p") continue;
    for (const u of urls) {
      const clean = u.replace(/\/$/, "");
      if (fam === "cat" || clean.startsWith("/cn/zh/cat/")) catTargets.push(clean);
      else contentTargets.push(clean);
    }
  }

  let done = 0;
  await mapLimit(contentTargets, CONCURRENCY, async (url) => {
    const data = await fetchPagePayload(url);
    let page = null;
    if (data) {
      page = extractContentPage(data.root, url);
      if (page.blocks.length === 0 && !page.title) page = null;
    }
    if (page) {
      fs.writeFileSync(
        path.join(pagesDir, safeName(url) + ".json"),
        JSON.stringify(page, null, 1),
      );
    }
    done++;
    if (done % 100 === 0) console.log(`  gaps content ${done}/${contentTargets.length}`);
  });
  console.log("gaps content done:", done);

  let catDone = 0;
  await mapLimit(catTargets, CONCURRENCY, async (url) => {
    const data = await fetchPagePayload(url);
    if (data) {
      const page = extractCatalogPage(data.root, url);
      if (page.name || page.products.length) {
        fs.writeFileSync(
          path.join(catDir, safeName(url) + ".json"),
          JSON.stringify(page, null, 1),
        );
      }
    }
    catDone++;
    if (catDone % 100 === 0) console.log(`  gaps cat ${catDone}/${catTargets.length}`);
  });
  console.log("gaps cat done:", catDone);
}

// -------------------------------------------------------- crawl URL list

async function crawlLinkList(file) {
  const urls = JSON.parse(fs.readFileSync(file, "utf8"));
  const pagesDir = path.join(repoRoot, "docs", "research", "data", "pages");
  const catDir = path.join(repoRoot, "docs", "research", "data", "catalog");
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(catDir, { recursive: true });

  let done = 0;
  await mapLimit(urls, CONCURRENCY, async (raw) => {
    const url = raw.replace(/\/$/, "");
    const data = await fetchPagePayload(url);
    let page = null;
    if (data) {
      page = extractContentPage(data.root, url);
      if (page.blocks.length === 0 && !page.title) page = null;
    }
    if (page) {
      fs.writeFileSync(
        path.join(pagesDir, safeName(url) + ".json"),
        JSON.stringify(page, null, 1),
      );
      console.log("OK", url, "|", (page.title || "").slice(0, 40));
    } else {
      console.log("SKIP", url);
    }
    done++;
  });
  console.log("link list done:", done, "/", urls.length);
}

// -------------------------------------------- re-extract existing pages

async function crawlReblocks() {
  const pagesDir = path.join(repoRoot, "docs", "research", "data", "pages");
  if (!fs.existsSync(pagesDir)) {
    console.log("no content pages to re-extract");
    return;
  }
  const urls = [];
  for (const f of fs.readdirSync(pagesDir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const page = JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8"));
      if (page.url) urls.push(page.url);
    } catch {
      /* skip corrupt file */
    }
  }
  console.log("re-extracting", urls.length, "content pages…");

  let done = 0;
  let ok = 0;
  await mapLimit(urls, CONCURRENCY, async (url) => {
    const data = await fetchPagePayload(url);
    let page = null;
    if (data) {
      page = extractContentPage(data.root, url);
      if (page.blocks.length === 0 && !page.title) page = null;
    }
    if (page) {
      fs.writeFileSync(
        path.join(pagesDir, safeName(url) + ".json"),
        JSON.stringify(page, null, 1),
      );
      ok++;
    }
    done++;
    if (done % 200 === 0) console.log(`  reblocks ${done}/${urls.length} ok=${ok}`);
  });
  console.log("reblocks done:", done, "ok:", ok);
  aggregatePages();
}

// --------------------------------------------------------------- products

function extractProduct(raw) {
  const p = raw.data ?? raw;
  const normalizeImage = (img) => {
    if (typeof img === "string") return img;
    if (img && typeof img === "object") {
      return typeof img.fullUrl === "string"
        ? img.fullUrl
        : typeof img.url === "string"
          ? img.url
          : null;
    }
    return null;
  };
  const images = (p.images ?? []).map(normalizeImage).filter(Boolean);
  return {
    id: String(p.productId ?? ""),
    name: p.name ?? "",
    productType: p.productType ?? null,
    designText: p.designText ?? null,
    price: p.price?.regularPrice ?? p.price?.price ?? null,
    image: normalizeImage(p.image ?? p.previewImage) ?? images[0] ?? null,
    labels: (p.labels ?? [])
      .filter((l) => l && typeof l === "object")
      .slice(0, 4)
      .map((l) => ({
        text: l.text ?? "",
        backgroundColor: l.backgroundColor ?? null,
        textColor: l.textColor ?? null,
      })),
    detail: {
      images: images.slice(0, 5),
      benefits: (p.benefits ?? [])
        .map((b) => (typeof b === "string" ? b : b.text ?? b.title ?? ""))
        .filter(Boolean)
        .slice(0, 6),
      dimension:
        typeof p.dimensionFormatText === "string"
          ? p.dimensionFormatText
          : typeof p.dimension === "string"
            ? p.dimension
            : null,
      materials: (p.customerMaterialList ?? [])
        .map((m) =>
          typeof m === "string" ? m : m.text ?? m.name ?? m.materialText ?? "",
        )
        .filter(Boolean)
        .slice(0, 8),
      care: (p.careInstructions ?? [])
        .map((c) => (typeof c === "string" ? c : c.text ?? c.title ?? ""))
        .filter(Boolean)
        .slice(0, 4),
      description:
        typeof (p.productDesc ?? p.fullDescription) === "string"
          ? (p.productDesc ?? p.fullDescription)
          : null,
    },
  };
}

async function crawlProducts() {
  const urls = await getSitemapUrls();
  const productUrls = urls.filter((u) => u.startsWith("/cn/zh/p/"));
  const targets = LIMIT ? productUrls.slice(0, LIMIT) : productUrls;
  console.log("product urls:", targets.length);

  let done = 0;
  let failed = 0;
  const products = new Map();
  await mapLimit(targets, CONCURRENCY, async (url) => {
    // Product details are extracted from the server-rendered page payload
    // (the detail API returns 400 for many valid products).
    const data = await fetchPagePayload(url);
    if (!data) {
      failed++;
      return;
    }
    const dataArr = data.root.data ?? [];
    const page = dataArr[0] ?? dataArr;
    const dataKeys = typeof page === "object" && page ? Object.keys(page) : [];
    const contentKey =
      dataKeys.find((k) => page[k] && (page[k].content || page[k].components)) ??
      dataKeys[0] ??
      null;
    const content = contentKey ? page[contentKey]?.content ?? {} : {};
    const product = extractProduct(content.product ?? {});
    if (!product.id) {
      failed++;
      return;
    }
    product.name = product.name || content.name || "";
    product.slug = url.split("/").filter(Boolean).at(-1) ?? "";
    products.set(product.slug, product);
    done++;
    if (done % 500 === 0) console.log(`  products ${done}/${targets.length} fail=${failed}`);
  });
  console.log("products done:", done, "failed:", failed);
  writeProductsParts(products);
}

// ------------------------------------------------------------ aggregation

function aggregatePages() {
  const pagesDir = path.join(repoRoot, "docs", "research", "data", "pages");
  const outDir = path.join(repoRoot, "src", "data", "pages");
  fs.mkdirSync(outDir, { recursive: true });
  const byFamily = new Map();
  for (const f of fs.readdirSync(pagesDir)) {
    const page = JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8"));
    const fam = page.family || "misc";
    if (!byFamily.has(fam)) byFamily.set(fam, []);
    byFamily.get(fam).push(page);
  }
  for (const [fam, pages] of byFamily) {
    pages.sort((a, b) => a.url.localeCompare(b.url));
    fs.writeFileSync(
      path.join(outDir, `${fam}.json`),
      JSON.stringify(pages, null, 0),
    );
    console.log(`${fam}: ${pages.length} pages -> src/data/pages/${fam}.json`);
  }
}

function aggregateCatalogs() {
  const catDir = path.join(repoRoot, "docs", "research", "data", "catalog");
  const outDir = path.join(repoRoot, "src", "data", "catalog-pages");
  fs.mkdirSync(outDir, { recursive: true });
  const pages = [];
  for (const f of fs.readdirSync(catDir)) {
    pages.push(JSON.parse(fs.readFileSync(path.join(catDir, f), "utf8")));
  }
  pages.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync(path.join(outDir, "all.json"), JSON.stringify(pages, null, 0));
  console.log("catalog pages:", pages.length);
}

function writeProductsParts(productsMap) {
  const outDir = path.join(repoRoot, "src", "data");
  fs.mkdirSync(path.join(outDir, "products"), { recursive: true });
  const products = [...productsMap.values()];
  const PARTS = 6;
  const chunk = Math.ceil(products.length / PARTS);
  for (let i = 0; i < PARTS; i++) {
    const slice = products.slice(i * chunk, (i + 1) * chunk);
    fs.writeFileSync(
      path.join(outDir, "products", `products-part-${i + 1}.json`),
      JSON.stringify(slice, null, 0),
    );
  }
  console.log("products aggregated:", products.length);
}

// ------------------------------------------------------------------- main

const mode = process.argv[2] ?? "--content";
if (mode === "--content") {
  await crawlContent();
  aggregatePages();
  aggregateCatalogs();
} else if (mode === "--products") {
  await crawlProducts();
} else if (mode === "--gaps") {
  await crawlGaps();
  aggregatePages();
  aggregateCatalogs();
} else if (mode === "--links") {
  await crawlLinkList(process.argv[3]);
  aggregatePages();
  aggregateCatalogs();
} else if (mode === "--reblocks") {
  await crawlReblocks();
} else if (mode === "--finalize") {
  aggregatePages();
  aggregateCatalogs();
} else {
  console.log("unknown mode", mode);
}
