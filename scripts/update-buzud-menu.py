#!/usr/bin/env python3
"""Regenerate the BUZUD header navigation (top bar + mega menu).

Reads the imported BUZUD products and rewrites:
  - frontend/src/data/homepage.json   (navMenuItems, megaMenuCategories)
  - frontend/src/data/menu-categories.json (the mega-menu categories with subs)

Usage: python3 scripts/update-buzud-menu.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DATA = ROOT / "frontend" / "src" / "data"

CATEGORY_META = [
    {
        "slug": "buzud-rapid-tests",
        "name": "快速检测试剂",
        "types": ["快速检测试剂"],
        "subs": [
            ("8885020710595", "早孕检测"),
            ("8885020710618", "排卵检测"),
            ("8885020710649", "阴道微生态检测"),
            ("8885020712209", "新冠/流感联检"),
            ("8885020710588", "幽门螺杆菌检测"),
            ("8885020710656", "尿路感染检测"),
            ("8885020712315", "甲流/乙流检测"),
            ("8885020710625", "便隐血检测"),
            ("8885020710663", "男性生育力检测"),
        ],
    },
    {
        "slug": "buzud-watches",
        "name": "智能手表",
        "types": ["智能手表"],
        "subs": [
            ("8885020712582", "Vibrance 经典款"),
            ("8885020712728", "Vibrance 绿色"),
            ("8885020712735", "Vibrance 粉色"),
            ("8885020712742", "Vibrance 星光"),
            ("8885020712759", "Vibrance 紫色"),
        ],
    },
    {
        "slug": "buzud-blood-pressure-monitors",
        "name": "血压计",
        "types": ["血压计"],
        "subs": [
            ("8885020710151", "上臂式 C02"),
            ("8885020711103", "上臂式 30C"),
            ("8885020711097", "上臂式 30S"),
        ],
    },
    {
        "slug": "buzud-glucose-management",
        "name": "血糖管理",
        "types": ["血糖监测", "血糖仪"],
        "subs": [
            ("8885020711394", "CGM 传感器 2.0"),
            ("8885020712339", "GlucoInsight Plus"),
            ("8885020712384", "GlucoInsight Lite"),
        ],
    },
    {
        "slug": "buzud-health-devices",
        "name": "健康监测设备",
        "types": ["体温计", "智能体重秤", "注射针头"],
        "subs": [
            ("8885020711677", "红外耳温枪 BZD100"),
            ("8885020711448", "智能体重秤 CF509"),
            ("8885020711547", "注射针头 32G 4mm"),
        ],
    },
]


def load_products() -> list[dict]:
    path = SRC_DATA / "products" / "products-part-1.json"
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    products = {p["id"]: p for p in load_products()}

    # 1. Top navigation bar.
    nav_items = [
        {"label": "所有商品", "href": "/cn/zh/all-products", "hasMegaMenu": True},
        {"label": "快速检测", "href": "/cn/zh/cat/buzud-rapid-tests"},
        {"label": "智能手表", "href": "/cn/zh/cat/buzud-watches"},
        {"label": "血压计", "href": "/cn/zh/cat/buzud-blood-pressure-monitors"},
        {"label": "血糖管理", "href": "/cn/zh/cat/buzud-glucose-management"},
        {"label": "健康设备", "href": "/cn/zh/cat/buzud-health-devices"},
        {"label": "客户服务", "href": "/cn/zh/customer-service/"},
    ]

    # 2. Mega-menu categories (name + sub-category names, for the admin editor).
    mega_categories = [
        {
            "name": cat["name"],
            "subCategories": [sub_name for _, sub_name in cat["subs"]],
        }
        for cat in CATEGORY_META
    ]

    homepage_path = SRC_DATA / "homepage.json"
    homepage = json.loads(homepage_path.read_text(encoding="utf-8"))
    homepage["navMenuItems"] = nav_items
    homepage["megaMenuCategories"] = mega_categories
    homepage_path.write_text(
        json.dumps(homepage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # 3. Mega-menu categories with sub-category links (rendered by MegaMenu).
    categories = []
    for cat in CATEGORY_META:
        members = [p for p in products.values() if p["productType"] in cat["types"]]
        image = members[0]["image"] if members else None
        subs = []
        for sku, sub_name in cat["subs"]:
            product = products[sku]
            subs.append(
                {
                    "name": sub_name,
                    "url": f"/cn/zh/p/{product['slug']}",
                    "image": product["image"],
                }
            )
        categories.append(
            {
                "name": cat["name"],
                "url": f"/cn/zh/cat/{cat['slug']}",
                "image": image,
                "subs": subs,
            }
        )

    (SRC_DATA / "menu-categories.json").write_text(
        json.dumps({"categories": categories}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("navMenuItems:")
    for item in nav_items:
        print(f"  {item['label']} -> {item['href']}")
    print("menu categories:", [c["name"] for c in categories])
    for cat in categories:
        print(f"  {cat['name']}: {len(cat['subs'])} subs")


if __name__ == "__main__":
    main()
