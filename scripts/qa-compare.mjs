import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/Users/srlove/Documents/Code/ikeas/docs/design-references/qa-compare";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "/"],
  ["cat", "/cn/zh/cat/cha-ji-10716/"],
  ["product", "/cn/zh/p/starkvind-si-da-wen-kong-qi-jing-hua-qi-hei-se-50501962/"],
  ["content", "/cn/zh/this-is-ikea/design/family-pub6583c259/"],
  ["login", "/cn/zh/profile/login/"],
  ["search", "/cn/zh/search/products?q=%E6%B2%99%E5%8F%91"],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--lang=zh-CN"] });
for (const [name, path] of pages) {
  for (const [side, base] of [["clone", "http://localhost:3200"], ["live", "https://www.ikea.cn"]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    try {
      await page.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: `${OUT}/${name}-${side}.png`, fullPage: false });
      console.log("OK", name, side);
    } catch (err) {
      console.log("FAIL", name, side, err.message);
    }
    await page.close();
  }
}
await browser.close();
