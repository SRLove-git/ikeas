// Classifies remaining sitemap gaps: 200-with-content vs 404/maintenance.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const missing = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "docs", "research", "data", "coverage-missing.json"), "utf8"),
);
const SITE = "https://www.ikea.cn";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const targets = [];
for (const [fam, urls] of Object.entries(missing)) {
  if (fam === "p") continue;
  for (const u of urls) targets.push(u);
}
console.log("checking", targets.length, "URLs");

const alive = [];
const dead = [];
let done = 0;
const CONC = 6;
const queue = [...targets];
const workers = Array.from({ length: CONC }, async () => {
  while (queue.length) {
    const u = queue.shift();
    try {
      let res = await fetch(SITE + u + "/", {
        headers: { "User-Agent": UA },
        redirect: "manual",
      });
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 500));
        res = await fetch(SITE + u + "/", {
          headers: { "User-Agent": UA },
          redirect: "manual",
        });
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") ?? "";
        if (loc.includes("404") || loc.includes("/planner/")) dead.push(u);
        else alive.push(u);
      } else if (res.status === 200) {
        const html = await res.text();
        if (html.includes("Maintenance")) dead.push(u);
        else if (html.includes("__NUXT_DATA__")) alive.push(u);
        else dead.push(u);
      } else {
        dead.push(u);
      }
    } catch {
      dead.push(u);
    }
    done++;
    if (done % 100 === 0) console.log("  checked", done, "/", targets.length);
  }
});
await Promise.all(workers);
console.log("ALIVE:", alive.length, "DEAD:", dead.length);
fs.writeFileSync(
  path.join(repoRoot, "docs", "research", "data", "gaps-alive.json"),
  JSON.stringify(alive, null, 1),
);
fs.writeFileSync(
  path.join(repoRoot, "docs", "research", "data", "gaps-dead.json"),
  JSON.stringify(dead, null, 1),
);
