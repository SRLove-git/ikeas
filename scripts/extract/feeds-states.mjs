import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
import fs from 'node:fs';

const { chromium } = pkg;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'zh-CN',
});
const page = await ctx.newPage();
await page.goto('https://www.ikea.cn/cn/zh/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);
try {
  const accept = page.getByText('我接受', { exact: true }).first();
  if (await accept.isVisible({ timeout: 1500 })) { await accept.click(); await page.waitForTimeout(500); }
} catch {}

const extractCards = () => {
  const cards = [...document.querySelectorAll('.shoppable-image-item')];
  return cards.map((item) => {
    const dot = item.querySelector('.shoppable-image-dot');
    const tooltip = item.querySelector('.shoppable-image-tooltip');
    const card = item.querySelector('.shoppable-image-card');
    const imageEl = item.closest('.inspiration-feeds-item__wrapper')?.querySelector('.i-image img') || item.closest('.inspiration-feeds-item__wrapper')?.querySelector('.i-image');
    const tags = [...(card?.querySelectorAll('.i-product-tag--text') || [])].map((t) => t.textContent.trim());
    const style = getComputedStyle(imageEl);
    const bg = style.backgroundImage;
    return {
      productId: dot?.getAttribute('data-product-id') || null,
      left: item.style.left,
      top: item.style.top,
      href: tooltip?.getAttribute('href') || null,
      tooltipPosition: tooltip?.className.match(/is-(top|bottom|left|right)/)?.[0] || null,
      title: card?.querySelector('.shoppable-image-card__title')?.textContent.trim() || null,
      desc: card?.querySelector('.shoppable-image-card__des')?.textContent.trim() || null,
      price: card?.querySelector('.i-price__sr-text')?.textContent.trim() || null,
      tagColor: card?.querySelector('.i-product-tag')?.getAttribute('style') || null,
      tags,
      image: imageEl?.tagName === 'IMG' ? imageEl.currentSrc || imageEl.src : (bg && bg !== 'none' ? bg : null),
      imageW: imageEl?.naturalWidth || null,
      imageH: imageEl?.naturalHeight || null,
    };
  });
};

const tabs = ['全部', '卧室', '客厅', '厨房', '书房', '浴室', '阳台', '儿童房', '户外', '餐厅', '门厅', '电竞', '新品'];
const result = {};
for (const tab of tabs) {
  try {
    const btn = page.locator(`.inspiration-feeds__tabs button`, { hasText: tab }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(3500);
    }
  } catch {}
  result[tab] = await page.evaluate(extractCards);
  console.log(tab, result[tab].length, 'cards; sample image:', result[tab][0]?.image?.slice(0, 90));
}

fs.writeFileSync('docs/research/components/feeds-states.json', JSON.stringify(result, null, 2));
await browser.close();
console.log('done');
