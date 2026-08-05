// Downloads assets from a JSON manifest (url + target) into public/.
// Usage: node scripts/download-assets.mjs <manifest.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');
const manifestPath = process.argv[2];

if (!manifestPath) {
  console.error('Usage: node scripts/download-assets.mjs <manifest.json>');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function downloadOne(item) {
  const targetPath = path.join(publicDir, item.target);
  if (fs.existsSync(targetPath)) return { ok: true, target: item.target, skipped: true };
  try {
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Referer: 'https://www.ikea.cn/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buf);
    return { ok: true, target: item.target, bytes: buf.length };
  } catch (err) {
    return { ok: false, url: item.url, error: err.message };
  }
}

async function run() {
  const results = [];
  let i = 0;
  while (i < manifest.length) {
    const batch = manifest.slice(i, i + 4);
    i += 4;
    const settled = await Promise.all(batch.map(downloadOne));
    results.push(...settled);
    for (const r of settled) {
      if (r.ok) console.log('OK', r.target, r.bytes ?? '(skipped)');
      else console.error('FAIL', r.url, r.error);
    }
  }
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

run();
