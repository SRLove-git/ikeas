// Exports the frontend's crawled data (TS/JSON) into server/src/main/resources/data
// so the Spring Boot backend can serve it through its REST API.
//
// Usage: node scripts/export-server-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcData = path.join(root, "frontend", "src", "data");
const outRoot = path.join(root, "backend", "src", "main", "resources", "data");

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
}

function writeJson(relOut, value) {
  const dest = path.join(outRoot, relOut);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(value));
  console.log(`exported -> ${path.relative(root, dest)} (${fs.statSync(dest).size} bytes)`);
}

// Homepage / menu / category data now lives in JSON (CMS-managed); copy the
// files byte-for-byte instead of transpiling the TS modules.
copy(path.join(srcData, "homepage.json"), path.join(outRoot, "homepage.json"));
copy(path.join(srcData, "menu-panels.json"), path.join(outRoot, "menu-panels.json"));
copy(path.join(srcData, "menu-categories.json"), path.join(outRoot, "menu-categories.json"));
copy(path.join(srcData, "catalog.json"), path.join(outRoot, "catalog.json"));
copy(path.join(srcData, "chat-knowledge.json"), path.join(outRoot, "chat-knowledge.json"));
// Legacy content pages were removed with the IKEA content cleanup.
writeJson("legacy-pages.json", { contentPages: [] });

// Raw crawled JSON stays byte-for-byte identical.
copy(path.join(srcData, "catalog-pages", "all.json"), path.join(outRoot, "catalog-pages.json"));

for (const name of fs.readdirSync(path.join(srcData, "pages")).filter((f) => f.endsWith(".json"))) {
  copy(path.join(srcData, "pages", name), path.join(outRoot, "pages", name));
}
for (const name of fs.readdirSync(path.join(srcData, "products")).filter((f) => f.endsWith(".json"))) {
  copy(path.join(srcData, "products", name), path.join(outRoot, "products", name));
}

console.log("Done.");
