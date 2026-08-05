// Prints focused DOM facts for a selector: imgs, background-images, svgs, links, text.
// Usage: node scripts/extract/inspect.mjs <url> <selector> [nth] [mobile]
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
const { chromium } = pkg;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'https://www.ikea.cn/cn/zh/';
const selector = process.argv[3];
const nth = Number(process.argv[4] ?? 0);
const mobile = process.argv[5] === 'mobile';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: mobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'zh-CN',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
try {
  const accept = page.getByText('我接受', { exact: true }).first();
  if (await accept.isVisible({ timeout: 1500 })) {
    await accept.click({ timeout: 2000 });
    await page.waitForTimeout(400);
  }
} catch {}
await page.waitForTimeout(800);

const locator = page.locator(selector).nth(nth);
await locator.scrollIntoViewIfNeeded({ timeout: 15000 });
await page.waitForTimeout(800);

const out = await locator.evaluate((el) => {
  const result = {};
  result.imgs = [...el.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc || i.src,
    dataSrc: i.getAttribute('data-src') || i.getAttribute('data-original'),
    alt: i.alt,
    w: i.naturalWidth,
    h: i.naturalHeight,
  }));
  result.backgroundImages = [...el.querySelectorAll('*')]
    .filter((x) => getComputedStyle(x).backgroundImage && getComputedStyle(x).backgroundImage !== 'none')
    .map((x) => ({ tag: x.tagName, classes: (x.className?.toString() || '').slice(0, 60), bg: getComputedStyle(x).backgroundImage.slice(0, 160) }));
  result.links = [...el.querySelectorAll('a')].slice(0, 40).map((a) => ({ text: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), href: a.href }));
  result.headings = [...el.querySelectorAll('h1,h2,h3,h4,h5')].map((h) => h.textContent.trim().replace(/\s+/g, ' ').slice(0, 80));
  result.svgMarkup = [...el.querySelectorAll('svg')].slice(0, 12).map((s) => s.outerHTML.slice(0, 600));
  result.htmlSnippet = el.outerHTML.slice(0, 4000);
  return result;
});

console.log(JSON.stringify(out, null, 1));
await browser.close();
