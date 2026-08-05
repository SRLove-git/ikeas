// Extraction harness for cloning workflows.
// Uses playwright-core with the system Chrome install.
// Usage:
//   node scripts/extract/browser.mjs full <url> <out.png> [mobile]
//   node scripts/extract/browser.mjs section <url> <selector> <outBase> <name> [mobile]
import pkg from '/tmp/ikea-extract/node_modules/playwright-core/index.js';
import fs from 'node:fs';
import path from 'node:path';

const { chromium, devices } = pkg;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const STYLE_PROPS = [
  'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'color',
  'textTransform', 'textDecoration', 'textDecorationLine', 'backgroundColor', 'backgroundImage',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'width', 'height', 'maxWidth', 'minWidth', 'maxHeight', 'minHeight',
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'rowGap', 'columnGap',
  'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  'boxShadow', 'overflow', 'overflowX', 'overflowY',
  'position', 'top', 'right', 'bottom', 'left', 'zIndex',
  'opacity', 'transform', 'transition', 'cursor', 'animation', 'animationName', 'animationDuration', 'animationTimingFunction', 'animationIterationCount', 'animationDelay',
  'objectFit', 'objectPosition', 'mixBlendMode', 'filter', 'backdropFilter',
  'whiteSpace', 'textOverflow', 'WebkitLineClamp', 'textAlign', 'verticalAlign',
  'borderCollapse', 'listStyle',
];

const WALK_SCRIPT = `
const STYLE_PROPS = ${JSON.stringify(STYLE_PROPS)};
function extractStyles(element) {
  const cs = getComputedStyle(element);
  const styles = {};
  for (const p of STYLE_PROPS) {
    const v = cs[p];
    if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)' && v !== '0s ease 0s') {
      styles[p] = v;
    }
  }
  return styles;
}
function walk(element, depth) {
  if (!element || depth > 6) return null;
  const children = [...element.children];
  const rect = element.getBoundingClientRect();
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classes: (element.className?.toString() || '').split(/\\s+/).filter(Boolean).slice(0, 8).join(' ') || undefined,
    attrs: (() => {
      const out = {};
      for (const a of element.attributes || []) {
        if (['class', 'style', 'id'].includes(a.name)) continue;
        const v = a.value;
        if (v && v.length < 200) out[a.name] = v;
      }
      return Object.keys(out).length ? out : undefined;
    })(),
    text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 300) : undefined,
    rect: rect.width > 0 || rect.height > 0 ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : undefined,
    styles: extractStyles(element),
    images: element.tagName === 'IMG' ? {
      src: element.currentSrc || element.src,
      alt: element.alt,
      w: element.naturalWidth,
      h: element.naturalHeight,
    } : undefined,
    childCount: children.length,
    children: children.slice(0, 24).map((c) => walk(c, depth + 1)).filter(Boolean),
  };
}
`;

async function openPage(browser, viewport, mobile) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    userAgent: mobile
      ? devices['iPhone 13'].userAgent
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

async function dismissOverlays(page) {
  try {
    const accept = page.getByText('我接受', { exact: true }).first();
    if (await accept.isVisible({ timeout: 1500 })) {
      await accept.click({ timeout: 2000 });
      await page.waitForTimeout(400);
    }
  } catch {}
  try {
    const close = page.locator('.popup_card .i-modal-close, .popup-card .close, .popup_card button[class*="close"], .popup-card button[class*="close"]').first();
    if (await close.isVisible({ timeout: 1000 })) {
      await close.click({ timeout: 1500 });
      await page.waitForTimeout(300);
    }
  } catch {}
}

async function main() {
  const [cmd, url, arg2, arg3, arg4] = process.argv.slice(2);
  if (!cmd || !url || !arg2) {
    console.error('Missing args');
    process.exit(1);
  }
  const mobile = cmd === 'full' ? arg3 === 'mobile' : arg4 === 'mobile';
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    if (cmd === 'full') {
      const { ctx, page } = await openPage(browser, mobile ? devices['iPhone 13'].viewport : { width: 1440, height: 900 }, mobile);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2500);
      await dismissOverlays(page);
      await page.waitForTimeout(800);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: arg2, fullPage: true });
      console.log(JSON.stringify({ url: page.url(), height, viewport: mobile ? 'mobile' : 'desktop', title: await page.title() }));
      await ctx.close();
    } else if (cmd === 'section') {
      const selector = arg2;
      const outBase = arg3;
      const name = arg4;
      const { ctx, page } = await openPage(browser, mobile ? devices['iPhone 13'].viewport : { width: 1440, height: 900 }, mobile);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2500);
      await dismissOverlays(page);
      await page.waitForTimeout(600);
      const locator = page.locator(selector).first();
      await locator.scrollIntoViewIfNeeded({ timeout: 15000 });
      await page.waitForTimeout(500);
      const box = await locator.boundingBox();
      if (!box) throw new Error(`No bounding box for ${selector}`);
      await page.screenshot({ path: `${outBase}-${name}.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
      const data = await locator.evaluate(
        (el, code) => {
          eval(code);
          return JSON.stringify(walk(el, 0));
        },
        WALK_SCRIPT
      );
      fs.mkdirSync(path.dirname(`${outBase}-${name}.json`), { recursive: true });
      fs.writeFileSync(`${outBase}-${name}.json`, JSON.stringify(JSON.parse(data), null, 2));
      console.log(`SAVED ${outBase}-${name}.png (+json) box=${JSON.stringify(box)}`);
      await ctx.close();
    } else if (cmd === 'multi') {
      // args: multi <url> <outDir> <mobile|desktop> <json-file-with-selector-list>
      const outDir = arg2;
      const mobile = arg3 === 'mobile';
      const listPath = arg4;
      const items = JSON.parse(fs.readFileSync(listPath, 'utf8'));
      const { ctx, page } = await openPage(browser, mobile ? devices['iPhone 13'].viewport : { width: 1440, height: 900 }, mobile);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
      await dismissOverlays(page);
      await page.waitForTimeout(800);
      fs.mkdirSync(outDir, { recursive: true });
      for (const item of items) {
        try {
          const locator = page.locator(item.selector).nth(item.nth ?? 0);
          await locator.scrollIntoViewIfNeeded({ timeout: 15000 });
          await page.waitForTimeout(600);
          const box = await locator.boundingBox();
          if (!box) {
            console.log(`SKIP ${item.name}: no box for ${item.selector}`);
            continue;
          }
          const safe = `${outDir}/${item.name}-${mobile ? 'mobile' : 'desktop'}`;
          await page.screenshot({ path: `${safe}.png`, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.width, height: box.height } });
          const data = await locator.evaluate(
            (el, code) => {
              eval(code);
              return JSON.stringify(walk(el, 0));
            },
            WALK_SCRIPT
          );
          fs.writeFileSync(`${safe}.json`, JSON.stringify(JSON.parse(data), null, 2));
          console.log(`SAVED ${safe}.png (+json) box=${JSON.stringify(box)}`);
        } catch (e) {
          console.log(`FAIL ${item.name}: ${e.message}`);
        }
      }
      await ctx.close();
    } else {
      console.error(`Unknown command ${cmd}`);
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
