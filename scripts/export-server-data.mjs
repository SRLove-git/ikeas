// Exports the frontend's crawled data (TS/JSON) into server/src/main/resources/data
// so the Spring Boot backend can serve it through its REST API.
//
// Usage: node scripts/export-server-data.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcData = path.join(root, "src", "data");
const outRoot = path.join(root, "server", "src", "main", "resources", "data");

// --- Convert a TS data module (pure data + type-only imports) into JSON ---
function exportTsData(relPath) {
  const file = path.join(srcData, relPath);
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: "remove",
    },
    fileName: file,
  });
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: () => ({}),
    console,
  };
  vm.runInNewContext(outputText, sandbox, { filename: file });
  return module.exports;
}

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

// Homepage / menu / category TS modules -> single JSON payloads.
writeJson("homepage.json", exportTsData("homepage.ts"));
writeJson("menu-panels.json", exportTsData("menu-panels.ts"));
writeJson("menu-categories.json", exportTsData("categories.ts"));
writeJson("catalog.json", exportTsData("catalog.ts"));
// Legacy content pages (heading/text/section shape). New crawled pages win;
// these fill the gaps, exactly like src/data/pages-index.ts.
writeJson("legacy-pages.json", exportTsData("pages.ts"));

// Raw crawled JSON stays byte-for-byte identical.
copy(path.join(srcData, "catalog-pages", "all.json"), path.join(outRoot, "catalog-pages.json"));

for (const name of fs.readdirSync(path.join(srcData, "pages")).filter((f) => f.endsWith(".json"))) {
  copy(path.join(srcData, "pages", name), path.join(outRoot, "pages", name));
}
for (const name of fs.readdirSync(path.join(srcData, "products")).filter((f) => f.endsWith(".json"))) {
  copy(path.join(srcData, "products", name), path.join(outRoot, "products", name));
}

console.log("Done.");
