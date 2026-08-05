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
await page.waitForTimeout(3000);
try {
  const accept = page.getByText('我接受', { exact: true }).first();
  if (await accept.isVisible({ timeout: 1500 })) { await accept.click(); await page.waitForTimeout(400); }
} catch {}

await page.locator('li', { hasText: '所有商品' }).first().hover();
await page.waitForTimeout(2500);

const items = await page.locator('.category-list > li').all();
const result = [];
for (let i = 0; i < items.length; i++) {
  const name = (await items[i].innerText()).trim().split('\n')[0];
  await items[i].hover();
  await page.waitForTimeout(700);
  const subs = await page.locator('.sub-list .category-box-name').allInnerTexts();
  const images = await page.locator('.sub-list .img-bg').evaluateAll((els) =>
    els.map((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none' ? bg : null;
    }),
  );
  result.push({
    name,
    subCategories: subs.map((s, j) => ({ name: s, image: images[j] })),
  });
  console.log(`${i + 1}/${items.length} ${name} -> ${subs.length} subs`);
}

fs.writeFileSync('docs/research/components/megamenu-data.json', JSON.stringify(result, null, 2));
await browser.close();
