import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/Users/srlove/Documents/Code/ikeas/docs/design-references/qa";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "http://127.0.0.1:3200/"],
  ["cat-cha-ji", "http://127.0.0.1:3200/cn/zh/cat/cha-ji-10716/"],
  ["cat-series-trofast", "http://127.0.0.1:3200/cn/zh/cat/trofast-shu-fa-te-wan-ju-chu-wu-xi-lie-19027/"],
  ["product-enhet", "http://127.0.0.1:3200/cn/zh/p/enhet-an-na-te-tvaellen-te-wei-lun-xi-lian-chi-gui-dai-chou-ti-xi-lian-chi-shui-long-tou-bai-se-dan-hui-lu-se-39567756/"],
  ["content-this-is-ikea", "http://127.0.0.1:3200/cn/zh/this-is-ikea/design/family-pub6583c259/"],
  ["content-newsroom", "http://127.0.0.1:3200/cn/zh/this-is-ikea/newsroom/lighting-pubd959128c/"],
  ["planner", "http://127.0.0.1:3200/cn/zh/planners/vimle-planner/"],
  ["stores", "http://127.0.0.1:3200/cn/zh/stores/"],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--lang=zh-CN"] });
for (const [name, url] of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log("OK", name);
  } catch (err) {
    console.log("FAIL", name, err.message);
  }
  await page.close();
}
await browser.close();
