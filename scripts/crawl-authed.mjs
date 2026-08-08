// Crawls ikea.cn pages that are only visible after login (cart, checkout,
// profile, orders, wishlist, compare).
//
// Usage: node scripts/crawl-authed.mjs
// - Opens a visible Chrome window pointed at the ikea.cn login page.
// - Waits until you sign in (or navigate away from the login page).
// - Then captures each protected page (HTML + screenshot) into
//   docs/research/data/authed/ and docs/design-references/qa-compare/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LOGIN_URL = "https://www.ikea.cn/cn/zh/profile/login/";

const TARGETS = [
  ["cart", "/cn/zh/cart/"],
  ["checkout", "/cn/zh/checkout/"],
  ["profile", "/cn/zh/profile/"],
  ["my-orders", "/cn/zh/profile/my-orders/"],
  ["wishlist", "/cn/zh/wishlist/"],
  ["compare", "/cn/zh/compare/"],
  ["membership", "/cn/zh/profile/membership/"],
];

const htmlDir = path.join(repoRoot, "docs", "research", "data", "authed");
const shotDir = path.join(repoRoot, "docs", "design-references", "qa-compare");
fs.mkdirSync(htmlDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  defaultViewport: { width: 1440, height: 900 },
  args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--lang=zh-CN"],
});

const page = await browser.newPage();
await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
console.log(">> 请在打开的 Chrome 窗口里登录宜家(或直接导航到其他页面)…");

// Wait for the user to sign in. A real login navigates away from the login
// page; a guest/anonymous token alone is not enough.
const deadline = Date.now() + 20 * 60 * 1000;
let loggedIn = false;
while (Date.now() < deadline) {
  try {
    const state = await page.evaluate(() => {
      const p = window.location.pathname;
      if (!p.includes("/profile/login") && !p.includes("/login")) return "navigated";
      return null;
    });
    if (state) {
      loggedIn = true;
      console.log(">> 检测到登录:", state);
      break;
    }
  } catch {
    /* page still loading */
  }
  await new Promise((r) => setTimeout(r, 2500));
}

if (!loggedIn) {
  console.log("!! 等待登录超时(20 分钟),停止抓取。");
  await browser.close();
  process.exit(1);
}

for (const [name, url] of TARGETS) {
  try {
    await page.goto("https://www.ikea.cn" + url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const html = await page.content();
    const title =
      (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.trim() || "";
    const is404 = html.includes("Page not found") || html.includes("哎呀");
    const hasContent = html.includes("__NUXT_DATA__") && !html.includes("Maintenance");
    fs.writeFileSync(path.join(htmlDir, `${name}.html`), html);
    await page.screenshot({
      path: path.join(shotDir, `authed-${name}.png`),
      fullPage: false,
    });
    console.log(
      `OK ${name} | ${page.url()} | title=${title.slice(0, 30)} | 404=${is404} | payload=${hasContent}`,
    );
  } catch (err) {
    console.log(`FAIL ${name} | ${err.message}`);
  }
}

await browser.close();
console.log(">> 抓取完成。HTML 在 docs/research/data/authed/,截图在 docs/design-references/qa-compare/。");
