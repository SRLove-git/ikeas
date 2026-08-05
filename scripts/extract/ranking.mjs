// Dumps full ranking section structure: panels, headers, products.
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
import fs from 'node:fs';
const { chromium } = pkg;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'zh-CN',
});
const page = await ctx.newPage();
await page.goto('https://www.ikea.cn/cn/zh/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
try {
  const accept = page.getByText('我接受', { exact: true }).first();
  if (await accept.isVisible({ timeout: 1500 })) {
    await accept.click({ timeout: 2000 });
    await page.waitForTimeout(400);
  }
} catch {}
await page.waitForTimeout(800);

const ranking = page.locator('.ranking-container');
await ranking.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

const data = await ranking.evaluate(() => {
  const root = document.querySelector('.ranking-container');
  const info = {
    panelCount: root.querySelectorAll('.pub-ranking-item').length,
    pillBar: (() => {
      const bar = root.querySelector('.content');
      return bar ? { html: bar.innerHTML.slice(0, 3000), visible: bar.children.length } : null;
    })(),
    panels: [],
  };
  for (const panel of root.querySelectorAll('.pub-ranking-item')) {
    const header = panel.querySelector('.pub-ranking-item-header');
    const headerStyles = header ? getComputedStyle(header) : null;
    const products = [];
    for (const p of panel.querySelectorAll('.pub-ranking-item-product')) {
      const img = p.querySelector('.pub-ranking-item-product__image img');
      const icon = p.querySelector('.pub-ranking-item-product__icon img');
      const texts = [...p.querySelectorAll('span, div, p, a')].map((x) => x.textContent.trim().replace(/\s+/g, ' ')).filter((t) => t && t.length < 80);
      products.push({
        image: img?.currentSrc || img?.src,
        imgW: img?.naturalWidth,
        imgH: img?.naturalHeight,
        rankIcon: icon?.currentSrc || icon?.src,
        texts: [...new Set(texts)].slice(0, 8),
        href: p.querySelector('a')?.href,
      });
    }
    info.panels.push({
      category: panel.querySelector('.pub-ranking-item-header-category')?.textContent?.trim(),
      title: panel.querySelector('.pub-ranking-item-header-title')?.textContent?.trim(),
      headerBg: headerStyles?.backgroundColor,
      headerColor: headerStyles?.color,
      headerHeight: headerStyles?.height,
      navArrow: panel.querySelector('.pub-ranking-item-header-nav-button svg')?.outerHTML?.slice(0, 300),
      productCount: products.length,
      products: products.slice(0, 14),
    });
  }
  // Which panel is currently visible?
  info.visiblePanel = (() => {
    for (const panel of root.querySelectorAll('.pub-ranking-item')) {
      const r = panel.getBoundingClientRect();
      if (r.left >= 0 && r.right <= 1440) return panel.querySelector('.pub-ranking-item-header-title')?.textContent?.trim();
    }
    return null;
  })();
  return info;
});

fs.mkdirSync('docs/research/data', { recursive: true });
fs.writeFileSync('docs/research/data/ranking.json', JSON.stringify(data, null, 2));
console.log('panels:', data.panelCount, 'visible:', data.visiblePanel, 'pillBarChildren:', data.pillBar?.visible);
console.log('panel1 products:', data.panels[0]?.productCount, data.panels[0]?.products?.[0]?.texts);
await browser.close();
