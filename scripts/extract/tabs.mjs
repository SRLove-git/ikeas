// Captures per-state content for click-driven sections (ranking pills, inspiration tabs).
// Usage: node scripts/extract/tabs.mjs <url>
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
import fs from 'node:fs';
const { chromium } = pkg;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'https://www.ikea.cn/cn/zh/';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
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

const out = {};

// ---- Hero slides: index -> image + href ----
await page.locator('#main-carousel-gallery').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
out.heroSlides = await page.evaluate(() => {
  return [...document.querySelectorAll('#main-carousel-gallery .swiper-slide')].map((s) => {
    const a = s.querySelector('a');
    const img = s.querySelector('img');
    return {
      index: s.getAttribute('data-swiper-slide-index'),
      href: a?.href,
      image: img?.currentSrc || img?.src,
      w: img?.naturalWidth,
      h: img?.naturalHeight,
      active: s.classList.contains('swiper-slide-active'),
    };
  });
});

// ---- Ranking: all panels (already in DOM) ----
const ranking = page.locator('.ranking-container');
await ranking.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
out.ranking = await ranking.evaluate(() => {
  const root = document.querySelector('.ranking-container');
  const panels = [];
  for (const panel of root.querySelectorAll('.pub-ranking-item')) {
    const header = panel.querySelector('.pub-ranking-item-header');
    const products = [];
    for (const p of panel.querySelectorAll('.pub-ranking-item-product')) {
      const img = p.querySelector('.pub-ranking-item-product__image img');
      const icon = p.querySelector('.pub-ranking-item-product__icon img');
      const nameEl = p.querySelector('.pub-ranking-item-product__name, .pub-ranking-item-product__title');
      const priceEl = p.querySelector('.pub-ranking-item-product__price, .pub-ranking-item-product__current-price');
      products.push({
        name: nameEl?.textContent?.trim(),
        price: priceEl?.textContent?.trim(),
        fullText: p.textContent.replace(/\s+/g, ' ').trim().slice(0, 100),
        image: img?.currentSrc || img?.src,
        rankIcon: icon?.currentSrc || icon?.src,
        href: p.querySelector('a')?.href,
      });
    }
    panels.push({
      category: panel.querySelector('.pub-ranking-item-header-category')?.textContent?.trim(),
      title: panel.querySelector('.pub-ranking-item-header-title')?.textContent?.trim(),
      headerBg: header ? getComputedStyle(header).backgroundColor : null,
      headerColor: header ? getComputedStyle(header).color : null,
      headerHeight: header ? getComputedStyle(header).height : null,
      products,
    });
  }
  return panels;
});
out.rankingScroll = await page.evaluate(() => {
  const wrap = document.querySelector('.ranking-container .i-scrollbar__wrap');
  return wrap ? { scrollWidth: wrap.scrollWidth, clientWidth: wrap.clientWidth } : null;
});

// ---- Product inspiration: tabs + products per tab ----
const feeds = page.locator('.inspiration-feeds, .m-x-5');
await feeds.first().scrollIntoViewIfNeeded();
await page.waitForTimeout(1000);
const tabSel = '.inspiration-feeds__tabs .i-pill, .i-tabs__item';
const tabCount = await page.locator(tabSel).count();
out.inspirationTabCount = tabCount;
out.inspiration = [];
const tabSeen = new Set();
for (let i = 0; i < tabCount; i++) {
  const tab = page.locator(tabSel).nth(i);
  const label = (await tab.textContent())?.trim();
  if (!label || tabSeen.has(label)) continue;
  tabSeen.add(label);
  const isActive = (await tab.getAttribute('aria-pressed')) === 'true';
  try {
    if (!isActive) await tab.click({ timeout: 4000 });
  } catch {
    continue;
  }
  await page.waitForTimeout(2200);
  // Wait until product links are rendered (retry up to ~10s).
  for (let r = 0; r < 6; r++) {
    const n = await page.locator('.i-waterfall a').count();
    if (r === 0 || n > 0) console.log(`tab=${label} retry=${r} links=${n}`);
    if (n > 0) break;
    await page.waitForTimeout(1500);
  }
  const products = await page.evaluate(() => {
    const seenSet = new Set();
    const items = [];
    const cards = [...document.querySelectorAll('.i-waterfall-container__column__item, .i-waterfall__item')];
    for (const card of cards) {
      const img = card.querySelector('img');
      const imgSrc = img?.currentSrc || img?.src;
      const aspectBox = card.querySelector('.i-aspect-ratio-box');
      const infoLink = card.querySelector('a[href*="/cn/zh/p/"]');
      const text = infoLink?.textContent.replace(/\s+/g, ' ').trim() || card.textContent.replace(/\s+/g, ' ').trim().slice(0, 100);
      if (!imgSrc || !text || seenSet.has(text)) continue;
      seenSet.add(text);
      const tags = [...card.querySelectorAll('.i-product-tag, [class*="tag"]')]
        .map((t) => t.textContent.trim())
        .filter(Boolean);
      items.push({
        text: text.slice(0, 140),
        href: infoLink?.href || card.querySelector('a')?.href,
        image: imgSrc,
        imgW: img.naturalWidth,
        imgH: img.naturalHeight,
        aspect: aspectBox?.getAttribute('value') || null,
        tags: [...new Set(tags)].slice(0, 4),
      });
    }
    return { items, diag: { total: cards.length } };
  });
  console.log('products eval for', label, JSON.stringify(products.diag));
  out.inspiration.push({ label, products: products.items });
}

fs.mkdirSync('docs/research/data', { recursive: true });
fs.writeFileSync('docs/research/data/tabs.json', JSON.stringify(out, null, 2));
console.log(`WROTE docs/research/data/tabs.json ranking=${out.ranking.length} panels, inspiration=${out.inspiration.length} tabs, inspirationProducts=${out.inspiration.reduce((a, t) => a + t.products.length, 0)}`);
await browser.close();
