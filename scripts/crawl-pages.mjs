// Crawls IKEA content pages (rooms, ideas, campaigns, services, business,
// landing pages) into src/data/pages.ts and downloads their images.
// Run: node scripts/crawl-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HEADERS = {
  Referer: "https://www.ikea.cn/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

const PAGES = [
  { url: "/cn/zh/rooms/living-room/", family: "rooms" },
  { url: "/cn/zh/rooms/bedroom/", family: "rooms" },
  { url: "/cn/zh/rooms/kitchen/", family: "rooms" },
  { url: "/cn/zh/rooms/dining/", family: "rooms" },
  { url: "/cn/zh/rooms/childrens-room/", family: "rooms" },
  { url: "/cn/zh/rooms/bathroom/", family: "rooms" },
  { url: "/cn/zh/rooms/home-office/", family: "rooms" },
  { url: "/cn/zh/rooms/hallway/", family: "rooms" },
  { url: "/cn/zh/rooms/balcony/", family: "rooms" },
  { url: "/cn/zh/rooms/outdoor/", family: "rooms" },
  { url: "/cn/zh/rooms/bedroom/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/dining/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/home-office/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/living-room/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/childrens-room/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/hallway/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/kitchen/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/bathroom/gallery/", family: "galleries" },
  { url: "/cn/zh/rooms/outdoor/gallery/", family: "galleries" },
  { url: "/cn/zh/ideas/rooms-inspiration/", family: "ideas" },
  { url: "/cn/zh/ideas/ikea-plus-you/", family: "ideas" },
  { url: "/cn/zh/ideas/curated-by-me/", family: "ideas" },
  { url: "/cn/zh/ideas/tips-for-more-sustainable-living/", family: "ideas" },
  { url: "/cn/zh/campaigns/wo3-men2-de-chao1-zhi2-di1-jia4-pub8b08af40", family: "campaigns" },
  { url: "/cn/zh/campaigns/new-lower-price-pubff11f9fb", family: "campaigns" },
  { url: "/cn/zh/campaigns/hopeful-summer-pub72b864f3", family: "campaigns" },
  { url: "/cn/zh/new/meet-the-ikea-ps-2026-collection-pubf28e636c", family: "new" },
  { url: "/cn/zh/new/let-your-home-come-out-and-play-pubc28e2323", family: "new" },
  { url: "/cn/zh/ikea-business/", family: "business" },
  { url: "/cn/zh/ikea-business/pi-liang-cai-gou-pub826b2633", family: "business" },
  { url: "/cn/zh/ikea-business/comprehensive-solutions/gong-cheng-xiang-mu-ji-he-zuo-pub922524e8", family: "business" },
  { url: "/cn/zh/ikea-business/gift-purchasing/li-pin-cai-gou-pubbd104a34", family: "business" },
  { url: "/cn/zh/landing-page/cn--zh--9bdb3af1c07611e8affa0d09be91682d", family: "landing" },
  { url: "/cn/zh/landing-page/5c84c33b5c95414bacf5f529c9d6a960", family: "landing" },
  { url: "/cn/zh/customer-service/services/delivery/", family: "services" },
  { url: "/cn/zh/customer-service/services/assembly/", family: "services" },
  { url: "/cn/zh/customer-service/services/kitchen-planning/", family: "services" },
  { url: "/cn/zh/customer-service/services/kitchen-installation/", family: "services" },
  { url: "/cn/zh/planners/", family: "planners" },
];

const EXT = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp", svg: "svg" };

function safeName(url) {
  return url.replace(/^\/+/, "").replace(/\/+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+/g, "-");
}

async function download(url, target) {
  if (fs.existsSync(target)) return;
  try {
    const res = await fetch(url.split("?")[0] + "?x-oss-process=image/quality,q_80/interlace,1/resize,w_800", {
      headers: HEADERS,
    });
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
  } catch {
    /* skip */
  }
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--lang=zh-CN"],
  });

  const results = [];
  const queue = [...PAGES];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      let page;
      try {
        page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto("https://www.ikea.cn" + job.url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise((r) => setTimeout(r, 2500));
        // scroll through the page to trigger lazy image loading
        await page.evaluate(async () => {
          const h = document.body.scrollHeight;
          for (let y = 0; y < h; y += 800) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 150));
          }
          window.scrollTo(0, 0);
        });
        await new Promise((r) => setTimeout(r, 2000));
        const data = await page.evaluate(() => {
          const title = document.title.replace(/\s*-\s*IKEA\s*$/, "").replace(/^宜家\s*-\s*/, "").trim();
          const h1s = [...document.querySelectorAll("h1")];
          const h1 =
            h1s.filter((h) => h.getBoundingClientRect().height > 0 && h.getBoundingClientRect().top < 2000).at(-1)?.textContent.trim() ||
            title ||
            "";
          const imgs = [...document.querySelectorAll("main img, .i-layout__body img")]
            .map((img) => ({ src: img.currentSrc || img.src, w: img.naturalWidth, h: img.naturalHeight, rect: img.getBoundingClientRect() }))
            .filter((x) => x.src && x.w >= 200 && x.rect.width > 100)
            .map((x) => x.src);
          const hero = imgs[0] || null;
          // sections: h2/h3 followed by text + an image
          const main = document.querySelector("main") || document.body;
          const sections = [];
          const headings = [...main.querySelectorAll("h2, h3")];
          headings.slice(0, 12).forEach((h, i) => {
            const heading = h.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
            if (!heading) return;
            let container = h.parentElement;
            for (let j = 0; j < 3 && container && container.querySelectorAll("h2,h3").length > 1; j++) {
              container = container.parentElement;
            }
            const textEls = container ? [...container.querySelectorAll("p, li")] : [];
            const text = textEls.map((t) => t.textContent.trim().replace(/\s+/g, " ")).filter((t) => t.length > 10).slice(0, 3).join(" ");
            const imgEl = container ? container.querySelector("img") : null;
            const img = imgEl && imgEl.naturalWidth >= 200 ? imgEl.currentSrc || imgEl.src : null;
            sections.push({ heading, text: text.slice(0, 400), image: img });
          });
          // if no sections, fall back to paragraphs
          if (sections.length === 0) {
            const ps = [...main.querySelectorAll("p")].map((p) => p.textContent.trim().replace(/\s+/g, " ")).filter((t) => t.length > 10);
            if (ps.length) sections.push({ heading: "", text: ps.slice(0, 4).join(" ").slice(0, 600), image: null });
          }
          const links = [...new Set([...main.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")))]
            .filter((h) => !/\.(css|js|png|jpg|svg|ico)$/.test(h))
            .slice(0, 14);
          return { title, h1, hero, sections, links, imgs: [...new Set(imgs)].slice(0, 8) };
        });
        results.push({ ...job, ...data });
        console.log("OK", job.url, "|", (data.h1 || data.title).slice(0, 30));
      } catch (err) {
        console.log("FAIL", job.url, err.message);
      } finally {
        if (page) await page.close();
      }
    }
  });
  await Promise.all(workers);
  await browser.close();

  // Download images
  const imgJobs = [];
  for (const r of results) {
    const base = "public/images/pages/" + safeName(r.url);
    const urls = [r.hero, ...r.imgs].filter(Boolean);
    [...new Set(urls)].slice(0, 6).forEach((u, i) => {
      const ext = EXT[(u.split("?")[0].split(".").pop() || "jpg").toLowerCase()] || "jpg";
      imgJobs.push({ url: u, target: path.join(repoRoot, base, `img-${i + 1}.${ext}`) });
    });
  }
  const q = [...imgJobs];
  const dlWorkers = Array.from({ length: 6 }, async () => {
    while (q.length) {
      const job = q.shift();
      await download(job.url, job.target);
    }
  });
  await Promise.all(dlWorkers);
  console.log("images:", imgJobs.length);

  // Localize image paths and write src/data/pages.ts
  for (const r of results) {
    delete r.imgs;
    const base = "/images/pages/" + safeName(r.url);
    const localize = (u) => {
      if (!u) return null;
      const i = [r.hero, ...r.imgs].filter(Boolean).indexOf(u);
      if (i < 0 || i > 5) return null;
      const ext = EXT[(u.split("?")[0].split(".").pop() || "jpg").toLowerCase()] || "jpg";
      const target = path.join(repoRoot, "public", base.slice(1), `img-${i + 1}.${ext}`);
      return fs.existsSync(target) ? `${base}/img-${i + 1}.${ext}` : null;
    };
    r.hero = localize(r.hero);
    r.sections = r.sections.map((s) => ({ ...s, image: localize(s.image) }));
  }

  const lines = [
    "// Generated by scripts/crawl-pages.mjs — do not hand-edit.",
    "export interface ContentSection {",
    "  heading: string;",
    "  text: string;",
    "  image: string | null;",
    "}",
    "",
    "export interface ContentPageData {",
    "  url: string;",
    "  family: string;",
    "  title: string;",
    "  h1: string;",
    "  hero: string | null;",
    "  sections: ContentSection[];",
    "  links: string[];",
    "}",
    "",
    "export const contentPages: ContentPageData[] = " + JSON.stringify(results, null, 1) + ";",
    "",
  ];
  fs.writeFileSync(path.join(repoRoot, "src", "data", "pages.ts"), lines.join("\n"));
  console.log("written src/data/pages.ts with", results.length, "pages");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
