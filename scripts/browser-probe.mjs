import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET = process.env.TARGET_URL ?? 'https://www.ikea.cn/cn/zh/';
const OUT = path.resolve('docs');

mkdirSync(path.join(OUT, 'design-references'), { recursive: true });
mkdirSync(path.join(OUT, 'research'), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'shell',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--lang=zh-CN',
    '--window-size=1440,900',
  ],
  defaultViewport: null,
});

async function capture(width, height, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  });
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Give the SPA / JS a moment to render
  await sleep(8000);
  try {
    await page.waitForSelector('img, main, body *', { timeout: 10000 });
  } catch {}
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  const info = await page.evaluate(() => {
    const cs = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: s.color,
        backgroundColor: s.backgroundColor,
      };
    };
    const fonts = [...new Set(
      [...document.querySelectorAll('h1,h2,h3,h4,p,a,button,body,span,li,div')]
        .slice(0, 400)
        .map((el) => getComputedStyle(el).fontFamily),
    )];
    const bgImages = [...document.querySelectorAll('*')]
      .filter((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        return bg && bg !== 'none';
      })
      .slice(0, 60)
      .map((el) => ({
        url: getComputedStyle(el).backgroundImage.slice(0, 300),
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString() || '').split(' ').slice(0, 3).join(' '),
      }));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyTextLen: document.body?.innerText?.length ?? 0,
      fonts,
      body: cs(document.body),
      h1: cs(document.querySelector('h1')),
      h2: cs(document.querySelector('h2')),
      imgCount: document.querySelectorAll('img').length,
      svgCount: document.querySelectorAll('svg').length,
      videoCount: document.querySelectorAll('video').length,
      iframeCount: document.querySelectorAll('iframe').length,
      canvasCount: document.querySelectorAll('canvas').length,
      linkCount: document.querySelectorAll('a').length,
      buttonCount: document.querySelectorAll('button').length,
      inputCount: document.querySelectorAll('input').length,
      bgImages,
      favicons: [...document.querySelectorAll('link[rel*="icon"]')].map((l) => ({
        href: l.href,
        sizes: l.sizes?.toString() || '',
      })),
      first1500Chars: document.body?.innerText?.slice(0, 1500) ?? '',
    };
  });

  const fullPath = path.join(OUT, 'design-references', `ikea-${label}-full.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  const vpPath = path.join(OUT, 'design-references', `ikea-${label}-viewport.png`);
  await page.screenshot({ path: vpPath });

  // Dump rendered HTML for offline DOM analysis
  if (width >= 1200) {
    const html = await page.content();
    writeFileSync(path.join(OUT, 'research', 'ikea-home-desktop.html'), html, 'utf8');
  }

  console.log(JSON.stringify({ label, width, height, ...info }, null, 2));
  await page.close();
}

await capture(1440, 900, 'desktop');
await capture(390, 844, 'mobile');

await browser.close();
