import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { migrateCmsData } from "./001-merge-brand-menu.mjs";

test("adds only missing brand menu entries and preserves CMS edits", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cms-migration-001-"));
  const seedRoot = path.join(root, "seed");
  const targetRoot = path.join(root, "target");
  fs.mkdirSync(seedRoot);
  fs.mkdirSync(targetRoot);

  const seed = {
    categories: [
      { name: "Seed regular", url: "/zh/cat/regular" },
      { name: "Seed Midea", url: "/zh/midea#fridge" },
      { name: "Seed Toshiba", url: "/zh/toshiba#laundry" },
    ],
  };
  const target = {
    categories: [
      { name: "CMS regular edit", url: "/zh/cat/regular" },
      { name: "CMS Midea edit", url: "/zh/midea#fridge" },
    ],
  };
  fs.writeFileSync(
    path.join(seedRoot, "menu-categories.json"),
    JSON.stringify(seed),
  );
  fs.writeFileSync(
    path.join(targetRoot, "menu-categories.json"),
    JSON.stringify(target),
  );

  try {
    assert.equal(migrateCmsData(seedRoot, targetRoot), 1);
    assert.equal(migrateCmsData(seedRoot, targetRoot), 0);
    const result = JSON.parse(
      fs.readFileSync(path.join(targetRoot, "menu-categories.json"), "utf8"),
    );
    assert.deepEqual(
      result.categories.map((category) => [category.name, category.url]),
      [
        ["CMS regular edit", "/zh/cat/regular"],
        ["CMS Midea edit", "/zh/midea#fridge"],
        ["Seed Toshiba", "/zh/toshiba#laundry"],
      ],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
