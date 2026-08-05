// Debug: what happens after clicking an inspiration tab.
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
await page.locator('.inspiration-feeds').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);

const state0 = await page.evaluate(() => {
  const feeds = document.querySelector('.inspiration-feeds');
  return {
    url: location.href,
    linkCount: feeds.querySelectorAll('a').length,
    waterFall: !!feeds.querySelector('.i-waterfall'),
    htmlSnippet: feeds.querySelector('.i-waterfall')?.outerHTML?.slice(0, 1500),
  };
});
console.log('STATE0', JSON.stringify(state0));

await page.locator('.inspiration-feeds__tabs .i-tabs__item').nth(1).click();
await page.waitForTimeout(2500);
const state1 = await page.evaluate(() => {
  const feeds = document.querySelector('.inspiration-feeds');
  return {
    url: location.href,
    linkCount: feeds.querySelectorAll('a').length,
    waterFall: !!feeds.querySelector('.i-waterfall'),
    activeTab: feeds.querySelector('.i-pill--active')?.textContent?.trim(),
    htmlSnippet: feeds.querySelector('.i-waterfall')?.outerHTML?.slice(0, 1500),
  };
});
console.log('STATE1', JSON.stringify(state1));
await browser.close();
