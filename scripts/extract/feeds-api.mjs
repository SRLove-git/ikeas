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

const seen = new Set();
page.on('response', async (res) => {
  const url = res.url();
  if (!/api|inspiration|product|list|feed/i.test(url)) return;
  if (seen.has(url)) return;
  seen.add(url);
  try {
    const ct = res.headers()['content-type'] || '';
    if (!ct.includes('json')) return;
    const body = await res.text();
    if (body.length > 40 && body.length < 8_000_000) {
      const safe = url.replace(/[^\w/.-]/g, '_').slice(0, 120);
      fs.writeFileSync(`docs/research/components/feed-api-${safe}.json`, body);
      console.log('SAVED', url, body.length);
    }
  } catch {}
});

await page.goto('https://www.ikea.cn/cn/zh/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);
// click a few tabs to trigger different API calls
for (const tab of ['卧室', '客厅']) {
  try {
    await page.getByRole('button', { name: tab, exact: true }).first().click();
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('tab click failed', tab, e.message);
  }
}
await browser.close();
console.log('done');
