#!/usr/bin/env python3
"""Import BUZUD products from the retail-price-list PDF into the site.

Reads "BUZUD 产品零售价清单(1).pdf", extracts the product table and the
embedded product images, then regenerates:

  - src/data/products/products-part-*.json  (the 23 BUZUD products)
  - src/data/catalog.json                   (BUZUD categories)
  - src/data/catalog-pages/all.json         (BUZUD catalog pages)
  - src/data/homepage.json                  (feed + ranking product sections)
  - public/images/products/buzud-*.jpg      (product photos)

Usage: python3 scripts/import-buzud-products.py
"""

import io
import json
import re
from pathlib import Path

import pdfplumber
import pypdf
from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "BUZUD 产品零售价清单(1).pdf"
SRC_DATA = ROOT / "src" / "data"
IMG_DIR = ROOT / "public" / "images" / "products"

# (page_index_0based, xobject_name, sku, name, usage, price, product_type, design_text)
PRODUCTS = [
    (0, "X34", "8885020710595", "HCG Pregnancy Rapid Test",
     "用于女性尿液中的 HCG 检测，辅助判断是否怀孕。", 4.8, "快速检测试剂", None),
    (0, "X53", "8885020710618", "LH Ovulation Rapid Test",
     "检测尿液中的黄体生成素（LH）峰值，辅助预测排卵期。", 5.8, "快速检测试剂", None),
    (0, "X60", "8885020710649", "Vaginal pH Rapid Test Panel",
     "检测阴道分泌物的 pH 值，辅助筛查阴道微生态异常及感染风险。", 16.0, "快速检测试剂", None),
    (0, "X63", "8885020712582", "BUZUD Watch Vibrance",
     "智能健康手表，用于日常活动、心率、睡眠等健康数据监测。", 237.0, "智能手表", None),
    (0, "X63", "8885020712728", "BUZUD Watch Vibrance Green",
     "智能健康手表，用于日常活动、心率、睡眠等健康数据监测。", 237.0, "智能手表", None),
    (0, "X63", "8885020712735", "BUZUD Watch Vibrance Pink",
     "智能健康手表，用于日常活动、心率、睡眠等健康数据监测。", 237.0, "智能手表", None),
    (0, "X63", "8885020712742", "BUZUD Watch Vibrance Star Light",
     "智能健康手表，用于日常活动、心率、睡眠等健康数据监测。", 237.0, "智能手表", None),
    (1, "X63", "8885020712759", "BUZUD Watch Vibrance Violet",
     "智能健康手表，用于日常活动、心率、睡眠等健康数据监测。", 237.0, "智能手表", None),
    (1, "X70", "8885020712209", "COVID-19/Flu A&B/RSV/Adeno Ag Combo Rapid Test Cassette (Swab) (1 test/box)",
     "通过鼻拭子快速筛查新冠、甲乙流、RSV 和腺病毒抗原。", 17.0, "快速检测试剂", "1 test/box"),
    (1, "X71", "8885020710588", "H.pylori Antigen Rapid Test",
     "检测粪便中的幽门螺杆菌抗原，辅助判断是否感染。", 18.0, "快速检测试剂", None),
    (1, "X74", "8885020711677", "BUZUD Infrared Ear Thermometer BZD100",
     "用于成人和儿童耳道测温，快速测量体温。", 87.0, "体温计", "BZD100"),
    (1, "X76", "8885020711448", "BUZUD Home Body Composition Scale CF509",
     "测量体重及体脂等身体成分数据，用于家庭健康管理。", 37.0, "智能体重秤", "CF509"),
    (1, "X79", "8885020710656", "BUZUD Urinary Tract Infections Test For Self-Testing",
     "居家尿液检测，辅助筛查尿路感染相关指标。", 16.0, "快速检测试剂", None),
    (1, "X80", "8885020711394", "BUZUD Continuous Glucose Monitoring System Sensor 2.0",
     "连续监测组织液葡萄糖变化，帮助了解全天血糖趋势。", 87.0, "血糖监测", "Sensor 2.0"),
    (1, "X82", "8885020712315", "BUZUD Influenza A&B Ag Rapid Test (Cassette) (5 test/box)",
     "快速筛查甲型及乙型流感病毒抗原；每盒 5 次检测。", 43.5, "快速检测试剂", "5 test/box"),
    (2, "X86", "8885020710625", "One-step Fecal Occult Blood Test",
     "检测粪便中的隐血，辅助发现消化道出血风险。", 18.0, "快速检测试剂", None),
    (2, "X87", "8885020710663", "SP-10 Male Fertility Rapid Test Cassette",
     "检测精液中的 SP-10 蛋白，辅助评估男性精子浓度水平。", 35.0, "快速检测试剂", None),
    (2, "X89", "8885020710151", "Upper Arm Blood Pressure Monitor C02",
     "家用上臂式血压计，用于测量收缩压、舒张压及脉搏。", 85.0, "血压计", "C02"),
    (2, "X90", "8885020711103", "BUZUD Blood Pressure Monitor 30C",
     "家用上臂式血压计，用于日常血压和脉搏监测。", 85.0, "血压计", "30C"),
    (2, "X92", "8885020711097", "BUZUD Blood Pressure Monitor 30S",
     "家用上臂式血压计，用于日常血压和脉搏监测。", 78.0, "血压计", "30S"),
    (2, "X94", "8885020712339", "GlucoInsight Plus meter",
     "配合血糖试纸检测指尖血糖，用于日常血糖管理。", 53.0, "血糖仪", None),
    (2, "X96", "8885020712384", "GlucoInsight Lite set",
     "配合血糖试纸和采血针检测指尖血糖，用于日常血糖管理。", 58.8, "血糖仪", None),
    (2, "X97", "8885020711547", "BUZUD Pen Needles Plus Pro 32G 4mm",
     "用于配合兼容的胰岛素注射笔进行皮下注射；规格为 32G × 4mm。", 26.0, "注射针头", "32G 4mm"),
]


def slugify(name: str, sku: str) -> str:
    """Lowercase English product name -> URL slug, keeping the SKU suffix."""
    without_parentheses = re.sub(r"\([^)]*\)", "", name)
    base = re.sub(r"[^a-z0-9]+", "-", without_parentheses.lower()).strip("-")
    return f"{base}-{sku}"


def price_str(price: float) -> str:
    return f"{price:.2f}"


def extract_images() -> dict[str, Path]:
    """Pull every embedded product photo out of the PDF as a JPEG."""
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    reader = pypdf.PdfReader(str(PDF_PATH))
    page_images: list[list[pypdf.generic.ImageFile]] = [
        list(page.images) for page in reader.pages
    ]
    by_name: dict[str, object] = {}
    for page in page_images:
        for img in page:
            by_name[img.name.split(".")[0]] = img.image

    saved: dict[str, Path] = {}
    for page_idx, xname, sku, *_ in PRODUCTS:
        if sku in saved:
            continue
        pil = by_name[xname]
        if not isinstance(pil, Image.Image):
            raise RuntimeError(f"no image for {sku}: {xname}")
        out = process_image(pil)
        dest = IMG_DIR / f"buzud-{sku}.jpg"
        out.save(dest, "JPEG", quality=88)
        saved[sku] = dest
    return saved


def process_image(src: Image.Image) -> Image.Image:
    """Apply ICC, trim the white border, and resize to a web-friendly size."""
    profile = src.info.get("icc_profile")
    if profile is not None:
        try:
            src = ImageCms.profileToProfile(
                src,
                io.BytesIO(profile),
                ImageCms.createProfile("sRGB"),
                outputMode="RGB",
            )
        except Exception:
            src = src.convert("RGB")
    else:
        src = src.convert("RGB")

    # Trim near-white margins (product shots sit on a white background).
    bbox = src.point(lambda p: 0 if p < 240 else 255).getbbox()
    if bbox is not None:
        pad = 6
        w, h = src.size
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        src = src.crop((left, top, right, bottom))

    max_dim = 1000
    if max(src.size) > max_dim:
        ratio = max_dim / max(src.size)
        src = src.resize(
            (round(src.width * ratio), round(src.height * ratio)), Image.LANCZOS
        )
    return src


def product_json(page_idx: int, xname: str, sku: str, name: str, usage: str,
                 price: float, product_type: str, design_text: str | None,
                 image_paths: dict[str, Path]) -> dict:
    slug = slugify(name, sku)
    image = f"/images/products/buzud-{sku}.jpg"
    return {
        "id": sku,
        "slug": slug,
        "name": name,
        "productType": product_type,
        "designText": design_text,
        "price": price,
        "originalPrice": None,
        "image": image,
        "labels": [],
        "detail": {
            "images": [image],
            "benefits": [usage],
            "dimension": None,
            "materials": [],
            "care": [],
            "description": usage,
        },
    }


def build_products(image_paths: dict[str, Path]) -> list[dict]:
    return [
        product_json(page_idx, xname, sku, name, usage, price, ptype, dtext, image_paths)
        for page_idx, xname, sku, name, usage, price, ptype, dtext in PRODUCTS
    ]


CATEGORY_DEFS = [
    {
        "id": "buzud-rapid-tests",
        "name": "快速检测试剂",
        "slug": "buzud-rapid-tests",
        "url": "/cn/zh/cat/buzud-rapid-tests",
        "description": "用于家庭自测的快速检测试剂盒，涵盖早孕、排卵、传染病、消化道及男性健康等常见筛查项目。",
        "types": ["快速检测试剂"],
    },
    {
        "id": "buzud-watches",
        "name": "智能手表",
        "slug": "buzud-watches",
        "url": "/cn/zh/cat/buzud-watches",
        "description": "BUZUD 智能健康手表，用于日常活动、心率、睡眠等健康数据监测。",
        "types": ["智能手表"],
    },
    {
        "id": "buzud-blood-pressure-monitors",
        "name": "血压计",
        "slug": "buzud-blood-pressure-monitors",
        "url": "/cn/zh/cat/buzud-blood-pressure-monitors",
        "description": "家用上臂式血压计，用于日常血压和脉搏监测。",
        "types": ["血压计"],
    },
    {
        "id": "buzud-glucose-management",
        "name": "血糖管理",
        "slug": "buzud-glucose-management",
        "url": "/cn/zh/cat/buzud-glucose-management",
        "description": "血糖仪与连续血糖监测系统，用于日常血糖管理。",
        "types": ["血糖监测", "血糖仪"],
    },
    {
        "id": "buzud-health-devices",
        "name": "健康监测设备",
        "slug": "buzud-health-devices",
        "url": "/cn/zh/cat/buzud-health-devices",
        "description": "耳温计、智能体重秤等家用健康监测设备。",
        "types": ["体温计", "智能体重秤", "注射针头"],
    },
]


def build_catalog(products: list[dict]) -> dict:
    catalog_categories = []
    for cat in CATEGORY_DEFS:
        members = [p for p in products if p["productType"] in cat["types"]]
        image = members[0]["image"] if members else None
        catalog_categories.append(
            {
                "id": cat["id"],
                "name": cat["name"],
                "slug": cat["slug"],
                "url": cat["url"],
                "image": image,
                "subs": [],
                "products": members,
            }
        )
    return {"catalogCategories": catalog_categories, "channelCategories": []}


def build_catalog_pages(products: list[dict]) -> list[dict]:
    pages = []
    for cat in CATEGORY_DEFS:
        members = [p for p in products if p["productType"] in cat["types"]]
        page_products = [
            {
                "id": p["id"],
                "name": p["name"],
                "price": p["price"],
                "image": p["image"],
                "productType": p["productType"],
                "designText": p["designText"],
                "measureText": None,
                "url": None,
                "seoSlug": p["slug"].rsplit("-", 1)[0],
            }
            for p in members
        ]
        pages.append(
            {
                "url": cat["url"],
                "id": cat["id"],
                "name": cat["name"],
                "description": cat["description"],
                "total": len(members),
                "products": page_products,
                "blocks": [],
                "productIds": [
                    {"id": p["id"], "type": "SPR", "fullId": f"s{p['id']}"}
                    for p in members
                ],
            }
        )
    return pages


def build_homepage_updates(products: list[dict]) -> dict:
    feed = []
    for i, p in enumerate(products[:12]):
        feed.append(
            {
                "productId": p["id"],
                "left": f"{8 + (i % 4) * 24}%",
                "top": f"{10 + (i % 3) * 30}%",
                "href": f"/cn/zh/p/{p['slug']}",
                "tooltipPosition": "is-top",
                "title": p["name"],
                "desc": p["productType"],
                "price": f"SGD {price_str(p['price'])}",
                "tags": ["BUZUD"],
                "tagStyle": "color: rgb(255, 255, 255); border-color: rgb(0, 88, 163); background-color: rgb(0, 88, 163); font-weight: bold;",
                "image": p["image"],
            }
        )

    ranking = []
    for cat in CATEGORY_DEFS:
        members = [p for p in products if p["productType"] in cat["types"]]
        ranking.append(
            {
                "id": cat["name"],
                "name": cat["name"],
                "backgroundColor": "rgb(0, 88, 163)",
                "products": [
                    {
                        "name": p["name"],
                        "price": price_str(p["price"]),
                        "image": p["image"],
                        "icon": None,
                    }
                    for p in members
                ],
            }
        )

    return {
        "feedProducts": {"全部": feed},
        "rankingSections": ranking,
        "searchHints": ["早孕检测", "血压计", "智能手表", "血糖仪", "幽门螺杆菌"],
    }


def main() -> None:
    if not PDF_PATH.exists():
        raise SystemExit(f"PDF not found: {PDF_PATH}")

    image_paths = extract_images()
    products = build_products(image_paths)
    assert len(products) == 23, f"expected 23 products, got {len(products)}"

    # 1. Product parts: part-1 holds all products, the rest stay empty.
    for part in ["part-1", "part-2", "part-3", "part-4", "part-5", "part-6"]:
        payload = products if part == "part-1" else []
        (SRC_DATA / "products" / f"products-{part}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    # 2. Catalog (categories with embedded products).
    (SRC_DATA / "catalog.json").write_text(
        json.dumps(build_catalog(products), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # 3. Catalog pages (one per category).
    pages_dir = SRC_DATA / "catalog-pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    (pages_dir / "all.json").write_text(
        json.dumps(build_catalog_pages(products), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # 4. Homepage product sections (feed, ranking, search hints).
    homepage_path = SRC_DATA / "homepage.json"
    homepage = json.loads(homepage_path.read_text(encoding="utf-8"))
    homepage.update(build_homepage_updates(products))
    homepage_path.write_text(
        json.dumps(homepage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"imported {len(products)} BUZUD products")
    print(f"images written to {IMG_DIR}: {len(image_paths)} files")
    for p in products:
        print(f"  {p['id']}  {p['name']}  SGD {price_str(p['price'])}  {p['slug']}")


if __name__ == "__main__":
    main()
