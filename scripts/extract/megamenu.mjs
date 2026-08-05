import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
import fs from 'node:fs';

const { chromium, devices } = pkg;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const WALK_SCRIPT = `
const STYLE_PROPS = ['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color','textTransform','textDecoration','backgroundColor','backgroundImage','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','width','height','maxWidth','minWidth','display','flexDirection','flexWrap','justifyContent','alignItems','gap','gridTemplateColumns','gridTemplateRows','borderRadius','border','boxShadow','overflow','position','top','right','bottom','left','zIndex','opacity','transform','transition','cursor','whiteSpace','textOverflow'];
function extractStyles(element) {
  const cs = getComputedStyle(element);
  const styles = {};
  for (const p of STYLE_PROPS) {
    const v = cs[p];
    if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)' && v !== '0s ease 0s') styles[p] = v;
  }
  return styles;
}
function walk(element, depth) {
  if (!element || depth > 8) return null;
  const children = [...element.children];
  const rect = element.getBoundingClientRect();
  return {
    tag: element.tagName.toLowerCase(),
    classes: (element.className?.toString() || '').split(/\\s+/).filter(Boolean).slice(0, 8).join(' ') || undefined,
    attrs: (() => { const out = {}; for (const a of element.attributes || []) { if (['class','style','id'].includes(a.name)) continue; const v = a.value; if (v && v.length < 200) out[a.name] = v; } return Object.keys(out).length ? out : undefined; })(),
    text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 200) : undefined,
    rect: rect.width > 0 || rect.height > 0 ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : undefined,
    styles: extractStyles(element),
    images: element.tagName === 'IMG' ? { src: element.currentSrc || element.src, alt: element.alt, w: element.naturalWidth, h: element.naturalHeight } : undefined,
    childCount: children.length,
    children: children.slice(0, 24).map((c) => walk(c, depth + 1)).filter(Boolean),
  };
}
`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
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

const target = page.locator('li', { hasText: '所有商品' }).first();
await target.hover();
await page.waitForTimeout(2500);

// Find the visible mega panel
const panel = page.locator('.header_container_bottom, .header_container__bottom, [class*="header_container_bottom"]').first();
const exists = await panel.count();
let saved = 'NO PANEL';
if (exists) {
  const box = await panel.boundingBox();
  if (box) {
    await page.screenshot({ path: 'docs/research/components/header-megamenu-desktop.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    const data = await panel.evaluate((el, code) => { eval(code); return JSON.stringify(walk(el, 0)); }, WALK_SCRIPT);
    fs.writeFileSync('docs/research/components/header-megamenu-desktop.json', JSON.stringify(JSON.parse(data), null, 2));
    saved = `SAVED box=${JSON.stringify(box)}`;
  }
}
console.log(saved);

// Also capture the app-promotion hover panel
const promo = page.locator('.nav-header-message-app-promotion').first();
await promo.hover();
await page.waitForTimeout(800);
const detail = page.locator('.detail-info-container').first();
if (await detail.isVisible().catch(() => false)) {
  const box = await detail.boundingBox();
  if (box) {
    await page.screenshot({ path: 'docs/research/components/header-apppromo-desktop.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    const data = await detail.evaluate((el, code) => { eval(code); return JSON.stringify(walk(el, 0)); }, WALK_SCRIPT);
    fs.writeFileSync('docs/research/components/header-apppromo-desktop.json', JSON.stringify(JSON.parse(data), null, 2));
    console.log(`SAVED apppromo box=${JSON.stringify(box)}`);
  }
}
await browser.close();
