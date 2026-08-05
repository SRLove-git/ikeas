// Checks ranking panel layout + nav arrow behavior.
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'zh-CN' });
const page = await ctx.newPage();
await page.goto('https://www.ikea.cn/cn/zh/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
try {
  const accept = page.getByText('我接受', { exact: true }).first();
  if (await accept.isVisible({ timeout: 1500 })) { await accept.click({ timeout: 2000 }); await page.waitForTimeout(400); }
} catch {}
await page.waitForTimeout(800);
const ranking = page.locator('.ranking-container');
await ranking.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);

const before = await ranking.evaluate(() => {
  const list = document.querySelector('.pub-ranking-list__content');
  return {
    scrollLeft: list?.scrollLeft,
    scrollWidth: list?.scrollWidth,
    clientWidth: list?.clientWidth,
    overflowX: list ? getComputedStyle(list).overflowX : null,
    panels: [...document.querySelectorAll('.ranking-container .pub-ranking-item')].map((p) => {
      const r = p.getBoundingClientRect();
      return { title: p.querySelector('.pub-ranking-item-header-title')?.textContent?.trim(), left: Math.round(r.left - document.querySelector('.ranking-container').getBoundingClientRect().left), width: Math.round(r.width) };
    }),
  };
});
console.log('BEFORE', JSON.stringify(before));

const nav = ranking.locator('.pub-ranking-item-header-nav-button').first();
const box = await nav.boundingBox();
if (box) {
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1200);
  const after = await ranking.evaluate(() => {
    const list = document.querySelector('.pub-ranking-list__content');
    const view = document.querySelector('.ranking-container .i-scrollbar__view');
    const wrap = document.querySelector('.ranking-container .i-scrollbar__wrap');
    return {
      scrollLeft: list?.scrollLeft,
      viewScrollLeft: view?.scrollLeft,
      wrapScrollLeft: wrap?.scrollLeft,
      viewOverflowX: view ? getComputedStyle(view).overflowX : null,
      wrapOverflowX: wrap ? getComputedStyle(wrap).overflowX : null,
      activeTitle: document.querySelector('.ranking-container .pub-ranking-item-header-title')?.textContent?.trim(),
    };
  });
  console.log('AFTER-CLICK', JSON.stringify(after));
}

// Click the right scroll arrow and observe the scrollable container.
const rightArrow = ranking.locator('.i-scrollbar__arrow.is-right button').first();
const rab = await rightArrow.boundingBox();
if (rab) {
  await page.mouse.click(rab.x + rab.width / 2, rab.y + rab.height / 2);
  await page.waitForTimeout(1200);
  const afterArrow = await ranking.evaluate(() => {
    const list = document.querySelector('.pub-ranking-list__content');
    const view = document.querySelector('.ranking-container .i-scrollbar__view');
    const wrap = document.querySelector('.ranking-container .i-scrollbar__wrap');
    return { scrollLeft: list?.scrollLeft, viewScrollLeft: view?.scrollLeft, wrapScrollLeft: wrap?.scrollLeft };
  });
  console.log('AFTER-RIGHT-ARROW', JSON.stringify(afterArrow));
}
await browser.close();
