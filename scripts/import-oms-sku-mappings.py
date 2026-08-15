#!/usr/bin/env python3
"""Import BUZUD ↔ OMS SKU mappings from a CSV into the BUZUD backend.

CSV columns (exact order):
    product_id,oms_sku_id,oms_sku_no

product_id must be a BUZUD product id present in
frontend/src/data/products/products-part-*.json.
oms_sku_id must be a positive integer. oms_sku_no is optional and is kept for
display/troubleshooting.

The script calls the protected admin endpoint:
    POST /api/v1/admin/oms/sku-mappings

Usage:
    python3 scripts/import-oms-sku-mappings.py [--dry-run]
"""

import argparse
import csv
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "backend" / "src" / "main" / "resources" / "oms" / "sku-mappings.csv"
DATA_GLOB = "frontend/src/data/products/products-part-*.json"
REQUIRED_HEADER = ["product_id", "oms_sku_id", "oms_sku_no"]


def load_buzud_product_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(ROOT.glob(DATA_GLOB)):
        products = json.loads(path.read_text(encoding="utf-8"))
        for product in products:
            if not isinstance(product, dict) or not product.get("id"):
                continue
            ids.add(str(product["id"]))
    if not ids:
        raise SystemExit("未找到 BUZUD 商品数据，请确认 frontend/src/data/products/ 存在")
    return ids


def parse_mappings(csv_path: Path, product_ids: set[str]) -> list[dict]:
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != REQUIRED_HEADER:
            raise SystemExit(
                "CSV 表头必须为: "
                + ",".join(REQUIRED_HEADER)
                + "，实际为: "
                + ",".join(reader.fieldnames or [])
            )
        rows = list(reader)

    if not rows:
        print("CSV 为空，无需导入")
        return []

    mappings: list[dict] = []
    product_seen: set[str] = set()
    sku_seen: set[str] = set()
    for row in rows:
        product_id = (row.get("product_id") or "").strip()
        oms_sku_id = (row.get("oms_sku_id") or "").strip()
        oms_sku_no = (row.get("oms_sku_no") or "").strip() or None

        if not product_id or not oms_sku_id:
            raise SystemExit(f"CSV 存在空字段，请检查: {row}")
        if product_id not in product_ids:
            raise SystemExit(f"product_id 不是 BUZUD 商品: {product_id}")
        if product_id in product_seen:
            raise SystemExit(f"product_id 重复: {product_id}")
        if oms_sku_id in sku_seen:
            raise SystemExit(f"oms_sku_id 重复: {oms_sku_id}")
        try:
            sku_id = int(oms_sku_id)
        except ValueError:
            raise SystemExit(f"oms_sku_id 必须为整数: {oms_sku_id}")
        if sku_id <= 0:
            raise SystemExit(f"oms_sku_id 必须为正整数: {oms_sku_id}")

        product_seen.add(product_id)
        sku_seen.add(oms_sku_id)
        mappings.append(
            {
                "productId": product_id,
                "omsSkuId": sku_id,
                "omsSkuNo": oms_sku_no,
            }
        )
    return mappings


def post_mapping(base_url: str, admin_key: str, mapping: dict) -> None:
    url = base_url.rstrip("/") + "/api/v1/admin/oms/sku-mappings"
    body = json.dumps(mapping).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Admin-Key": admin_key,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(
            f"导入失败 productId={mapping['productId']} HTTP {exc.code}: {detail}"
        )
    except urllib.error.URLError as exc:
        raise SystemExit(
            f"无法连接 BUZUD 后端 productId={mapping['productId']}: {exc.reason}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--base-url", default="http://localhost:8080")
    parser.add_argument("--admin-key", default="ikea-admin")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    product_ids = load_buzud_product_ids()
    mappings = parse_mappings(args.csv, product_ids)
    if not mappings:
        return 0

    print(f"校验通过，共 {len(mappings)} 条映射")
    for mapping in mappings:
        print(
            f"  {mapping['productId']} -> omsSkuId={mapping['omsSkuId']}"
            + (f" omsSkuNo={mapping['omsSkuNo']}" if mapping["omsSkuNo"] else "")
        )

    if args.dry_run:
        print("dry-run：未写入后端")
        return 0

    for mapping in mappings:
        post_mapping(args.base_url, args.admin_key, mapping)
    print("导入完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
