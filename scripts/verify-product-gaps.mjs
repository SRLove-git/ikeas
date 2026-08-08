// After the full product crawl, classifies product URLs that are still missing:
// dead (maintenance/404 on live site) vs genuinely crawlable but missed.
// Usage: node scripts/verify-product-gaps.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const SITEMAP_DIR = "/tmp/ikea-sitemaps";
const SITE = "https://www.ikea.cn";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sitemap = new Set();
for (const f of fs.readdirSync(SITEMAP_DIR)) {
  if (!f.endsWith(".xml")) continue;
  const xml = fs.readFileSync(path.join(SITEMAP_DIR, f), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = m[1].replace(SITE, "").replace(/\/$/, "");
    if (u.startsWith("/cn/zh/p/")) sitemap.add(u);
  }
}

const covered = new Set();
const productsDir = path.join(repoRoot, "src", "data", "products");
if (fs.existsSync(productsDir)) {
  for (const f of fs.readdirSync(productsDir)) {
    const list = JSON.parse(fs.readFileSync(path.join(productsDir, f), "utf8"));
    for (const p of list) if (p.slug) covered.add(`/cn/zh/p/${p.slug}`);
  }
}

const gaps = [...sitemap].filter((u) => !covered.has(u));
console.log("product gaps:", gaps.length);

const dead = [];
const retryable = [];
let done = 0;
const queue = [...gaps];
const CONC = 6;
const workers = Array.from({ length: CONC }, async () => {
  while (queue.length) {
    const u = queue.shift();
    try {
      const res = await fetch(SITE + u + "/", {
        headers: { "User-Agent": UA },
        redirect: "manual",
      });
      if (res.status === 200) {
        const html = await res.text();
        if (html.includes("Maintenance")) dead.push(u);
        else if (html.includes("__NUXT_DATA__")) retryable.push(u);
        else dead.push(u);
      } else if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") ?? "";
        if (/404|planner/.test(loc)) dead.push(u);
        else retryable.push(u);
      } else {
        dead.push(u);
      }
    } catch {
      dead.push(u);
    }
    done++;
    if (done % 500 === 0) console.log("  checked", done, "/", gaps.length);
  }
});
await Promise.all(workers);

fs.writeFileSync(
  path.join(repoRoot, "docs", "research", "data", "product-dead.json"),
  JSON.stringify(dead, null, 1),
);
fs.writeFileSync(
  path.join(repoRoot, "docs", "research", "data", "product-retryable.json"),
  JSON.stringify(retryable, null, 1),
);
console.log("DEAD:", dead.length, "RETRYABLE:", retryable.length);
