// Audits every content page's block data for render-adequacy: rich block types
// must carry enough items/images/columns to produce a real layout (not text).
// Usage: node scripts/audit-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Block types that NEED images/items/columns to render properly.
const RICH_TYPES = new Set([
  "pub-hero",
  "pub-standardised-hero",
  "pub-image",
  "image",
  "pub-banner",
  "pub-curated-gallery",
  "pub-columns",
  "pub-product-shelf",
  "pub-product-list",
  "product-list",
  "pub-visual-pill-slider",
  "pub-inspiration-card",
  "pub-image-with-text-box",
  "pub-assurances",
  "pub-page-list",
  "pub-visual-navigation",
  "ranking",
  "pub-video-link",
  "video",
]);

const issues = [];
let pages = 0;
let richBlocks = 0;
let deficient = 0;

const files = fs.readdirSync(path.join(repoRoot, "src", "data", "pages"));
for (const f of files) {
  if (!f.endsWith(".json")) continue;
  for (const page of JSON.parse(
    fs.readFileSync(path.join(repoRoot, "src", "data", "pages", f), "utf8"),
  )) {
    pages++;
    for (const block of page.blocks ?? []) {
      if (!RICH_TYPES.has(block.type)) continue;
      richBlocks++;
      const items = block.items ?? [];
      const hasItems = items.some((i) => i.image || i.title);
      const hasImages = (block.images ?? []).length > 0;
      const hasColumns = (block.columns ?? []).length > 0;
      const ok =
        hasItems ||
        hasImages ||
        hasColumns ||
        block.type === "ranking" ||
        block.type === "pub-assurances" ||
        block.type === "pub-visual-navigation";
      if (!ok) {
        deficient++;
        issues.push(
          `${page.url} | ${block.type} | texts=${block.texts.length} imgs=${block.images.length} items=${items.length}`,
        );
      }
    }
  }
}

console.log(`pages: ${pages} | rich blocks: ${richBlocks} | deficient: ${deficient}`);
const grouped = new Map();
for (const line of issues) {
  const type = line.split(" | ")[1];
  if (!grouped.has(type)) grouped.set(type, []);
  grouped.get(type).push(line);
}
for (const [type, lines] of [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n== ${type}: ${lines.length}`);
  for (const l of lines.slice(0, 6)) console.log("  ", l);
  if (lines.length > 6) console.log(`   … +${lines.length - 6} more`);
}
