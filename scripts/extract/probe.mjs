// Prints a live topology of the page: section selectors with rects + first heading.
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
const { chromium, devices } = pkg;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'https://www.ikea.cn/cn/zh/';
const mobile = process.argv[3] === 'mobile';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: mobile ? devices['iPhone 13'].viewport : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: mobile
    ? devices['iPhone 13'].userAgent
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

const selectors = [
  '.nav-header-message',
  '.nav-header',
  '.swiper-container, .swiper, [class*="hero"]',
  '.pub-inspiration-card',
  '.pub-columns.three-columns',
  '.ranking-container',
  '.pub-visual-pill-slider',
  '.inspiration-feeds__tabs',
  '.m-x-5',
  '.rich-text__container',
  '.pub-assurances',
  '.pub-button-link',
  '.pub-page-list',
  '.i-layout__footer',
  '.i-layout__bottom-navigation, .i-nav-mobile',
  '.cloud.slide, .i-cookie, [class*="cookie"]',
  '.chat-menu',
  '.i-back-top',
  '.app-download-banner__wrapper',
  '.float-app-button',
];

const data = await page.evaluate((sels) => {
  const out = [];
  for (const sel of sels) {
    const els = [...document.querySelectorAll(sel)].slice(0, 6);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const h = el.querySelector('h1,h2,h3');
      const imgs = [...el.querySelectorAll('img')];
      out.push({
        sel,
        classes: (el.className?.toString() || '').split(/\s+/).filter(Boolean).slice(0, 6).join(' '),
        y: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        w: Math.round(r.width),
        heading: h?.textContent?.trim().slice(0, 40),
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
        imgCount: imgs.length,
        imgLoaded: imgs.filter((i) => i.naturalWidth > 0).length,
      });
    }
  }
  return out;
}, selectors);

for (const row of data) console.log(JSON.stringify(row));
console.log('PAGE_H', await page.evaluate(() => document.documentElement.scrollHeight));
await browser.close();
