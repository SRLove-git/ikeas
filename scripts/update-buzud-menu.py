#!/usr/bin/env python3
"""Normalize the CHUNG YIP header navigation without dropping categories.

The menu catalogue is maintained through the admin UI and already contains
the complete medical, Midea, and Toshiba taxonomy. This script only normalizes
its two-level grouping and refreshes the homepage editor's category summary;
it never regenerates the catalogue from the small legacy BUZUD product list.

Writes:
  - frontend/src/data/menu-categories.json
  - frontend/src/data/homepage.json (megaMenuCategories only)

Usage: python3 scripts/update-buzud-menu.py
"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SRC_DATA = ROOT / "frontend" / "src" / "data"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def normalize_group(category: dict) -> None:
    """Keep the existing category and assign its stable group/subgroup."""

    url = str(category.get("url") or "")
    group = str(category.get("group") or "").strip()
    subgroup = str(category.get("subgroup") or "").strip()

    if "/zh/midea" in url or group == "美的":
        category["group"] = "家电"
        category["subgroup"] = "美的"
        return

    if "/zh/toshiba" in url or group == "东芝":
        category["group"] = "家电"
        category["subgroup"] = "东芝"
        return

    if group == "家电":
        category["group"] = "家电"
        category["subgroup"] = subgroup or "其他家电"
        return

    # Before the two-level navigation change the former group value was the
    # medical subgroup, so retain it instead of collapsing every category.
    category["group"] = "医疗"
    category["subgroup"] = subgroup or (
        group if group and group != "医疗" else "健康检测与管理"
    )


def main() -> None:
    menu_path = SRC_DATA / "menu-categories.json"
    menu = load_json(menu_path)
    categories = menu.get("categories")
    if not isinstance(categories, list) or not categories:
        raise SystemExit("menu-categories.json has no categories")

    for category in categories:
        normalize_group(category)
    write_json(menu_path, menu)

    homepage_path = SRC_DATA / "homepage.json"
    homepage = load_json(homepage_path)
    homepage["megaMenuCategories"] = [
        {
            "name": category.get("name", ""),
            "subCategories": [
                sub.get("name", "")
                for sub in category.get("subs", [])
                if sub.get("name")
            ],
        }
        for category in categories
        if category.get("name")
    ]
    write_json(homepage_path, homepage)

    group_counts: dict[str, int] = {}
    for category in categories:
        key = f"{category['group']} / {category['subgroup']}"
        group_counts[key] = group_counts.get(key, 0) + 1

    print(f"menu categories preserved: {len(categories)}")
    for name, count in group_counts.items():
        print(f"  {name}: {count}")


if __name__ == "__main__":
    main()
