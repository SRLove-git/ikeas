import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MENU_FILES = [
  "menu-categories.json",
  "menu-categories.en.json",
  "menu-categories.ms.json",
  "menu-categories.id.json",
];

function copyMissing(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyMissing(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
}

function isManagedBrandCategory(category) {
  return (
    typeof category?.url === "string" &&
    (category.url.startsWith("/zh/midea") ||
      category.url.startsWith("/zh/toshiba"))
  );
}

function mergeBrandMenu(seedFile, targetFile) {
  if (!fs.existsSync(seedFile) || !fs.existsSync(targetFile)) return 0;
  const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  const target = JSON.parse(fs.readFileSync(targetFile, "utf8"));
  if (!Array.isArray(seed.categories) || !Array.isArray(target.categories))
    return 0;

  const existingUrls = new Set(
    target.categories.map((category) => category?.url).filter(Boolean),
  );
  const additions = seed.categories.filter(
    (category) =>
      isManagedBrandCategory(category) && !existingUrls.has(category.url),
  );
  if (additions.length === 0) return 0;

  target.categories.push(...additions);
  const temporary = `${targetFile}.migration-001.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(target, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, targetFile);
  return additions.length;
}

export function migrateCmsData(seedRoot, targetRoot) {
  fs.mkdirSync(targetRoot, { recursive: true });
  copyMissing(seedRoot, targetRoot);
  let added = 0;
  for (const file of MENU_FILES) {
    added += mergeBrandMenu(
      path.join(seedRoot, file),
      path.join(targetRoot, file),
    );
  }
  return added;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const seedRoot = process.env.CMS_SEED_ROOT || "/app/data-seed";
  const targetRoot = process.env.CMS_DATA_ROOT || "/app/src/data";
  const added = migrateCmsData(seedRoot, targetRoot);
  console.log(`CMS migration 001 complete; added ${added} brand menu entries`);
}
