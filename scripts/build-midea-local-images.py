#!/usr/bin/env python3
"""Build lightweight local product images from the archived Midea source folders."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_SUFFIXES = {".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}
PREFERRED_PATH_WORDS = ("highres", "highresolution", "productimage", "产品图", "商品图", "白底", "高清图")
DISFAVORED_PATH_WORDS = (
    "certificate",
    "certification",
    "installation",
    "launchmemo",
    "manual",
    "packaging",
    "parameter",
    "specification",
    "video",
    "包材",
    "参数",
    "安装",
    "认证",
    "说明书",
    "视频",
)
DISFAVORED_FILE_WORDS = ("barcode", "icon", "label", "logo", "qrcode", "sticker", "二维码", "标签")
IMAGE_OVERRIDES = {
    "midea-mdrb470mgd28": "高清图/1-美的外销 BCD345布鲁钢金属风道-正面.png",
    "midea-mdrc154fzb01my": "产品高清图/MDRC154FZB01MY正面关.png",
    "midea-mdrf698fic45sg": "图片/BCD515 玄武灰 正面关门.jpg",
    "midea-mfz410r0apkh": "产品高清图/FZ10-21AR（黑色）-正面.psd.tif",
    "midea-mec-1012w": "产品高清图/DY16Easy101 _FrontRight.jpg",
    "midea-mec-1036w": "产品高清图/美的DY3020多功能锅1.jpg",
    "midea-mri070t1bdg": "photo/正.tif",
    "midea-mrd180b1adrh": "产品高清图/正视改.png",
    "midea-mrd180t2ads": "产品高清图/正面改颜色.png",
    "midea-md200h80w": "产品高清图/MD200 images/White图片/白色_0-1.png",
    "midea-md200h80wt": "产品高清图/MD200 images/Black图片/金属钛_0-1.png",
    "midea-md200h80-heat-pump": "产品高清图/MD200H80WW/Front view.jpg",
    "midea-md210-heat-pump": "Product Image/Old UI/White Background/1. Front.png",
    "midea-mf110": "pics/1. Front.png",
    "midea-laundry-suite": "产品高清图/laundry suite-1 (1).png",
    "midea-eg-p06sg": "产品高清图/白底A_2.png",
    "midea-mvc-i5c": "产品高清图/MVC-I5C (1).png",
    "midea-mv15ultraapbk": "产品图/白色/产品图正面-白色.png",
}


def compact(value: str) -> str:
    return "".join(character.casefold() for character in value if character.isalnum())


def model_variants(product: dict[str, object]) -> set[str]:
    values = {compact(str(product["model"])), compact(str(product["id"]).removeprefix("midea-"))}
    for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9-]{3,}", str(product["model"])):
        values.add(compact(token))
    return {value for value in values if len(value) >= 5}


def image_info(path: Path) -> tuple[int, int, bool] | None:
    try:
        with Image.open(path) as image:
            width, height = image.size
            has_alpha = image.mode in {"LA", "RGBA"} or "transparency" in image.info
            return width, height, has_alpha
    except (Image.DecompressionBombError, OSError, ValueError):
        return None


def score_candidate(
    path: Path,
    folder: Path,
    variants: set[str],
    sibling_variants: set[str],
    info: tuple[int, int, bool],
) -> int:
    relative = path.relative_to(folder)
    relative_text = compact(str(relative))
    stem_text = compact(path.stem)
    score = 0

    exact_match = any(stem_text == variant for variant in variants)
    contains_match = any(variant in stem_text for variant in variants)
    path_match = any(variant in relative_text for variant in variants)
    if exact_match:
        score += 1_000
    elif contains_match:
        score += 500
    elif path_match:
        score += 180

    for other in sibling_variants - variants:
        if len(other) >= 5 and other in stem_text and not contains_match:
            score -= 700

    for word in PREFERRED_PATH_WORDS:
        if compact(word) in relative_text:
            score += 180
    for word in DISFAVORED_PATH_WORDS:
        if compact(word) in relative_text:
            score -= 500
    for word in DISFAVORED_FILE_WORDS:
        if compact(word) in stem_text:
            score -= 700

    if stem_text in {"1", "01", "001"}:
        score += 220
    elif stem_text in {"2", "02", "002"}:
        score += 100
    if any(word in stem_text for word in ("front", "hero", "main", compact("主图"))):
        score += 220

    width, height, has_alpha = info
    shortest = min(width, height)
    longest = max(width, height)
    ratio = width / height
    if shortest >= 600:
        score += 90
    elif shortest >= 300:
        score += 30
    else:
        score -= 300
    if longest >= 1_000:
        score += 30
    if 0.55 <= ratio <= 1.8:
        score += 50
    else:
        score -= 120
    if has_alpha:
        score += 25

    score -= len(relative.parts) * 2
    return score


def choose_image(
    source_root: Path,
    product: dict[str, object],
    variants_by_folder: dict[str, set[str]],
) -> tuple[Path, int]:
    source_folder = str(product["sourceFolder"])
    folder = source_root / source_folder
    override = IMAGE_OVERRIDES.get(str(product["id"]))
    if override:
        path = folder / override
        if not path.is_file() or image_info(path) is None:
            raise RuntimeError(f"Invalid image override for {product['id']}: {path}")
        return path, 10_000

    variants = model_variants(product)
    candidates: list[tuple[int, Path]] = []

    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        info = image_info(path)
        if info is None:
            continue
        score = score_candidate(path, folder, variants, variants_by_folder[source_folder], info)
        candidates.append((score, path))

    if not candidates:
        raise RuntimeError(f"No readable images found for {product['id']} in {folder}")
    score, path = max(candidates, key=lambda item: (item[0], -len(str(item[1])), str(item[1])))
    return path, score


def convert_image(source: Path, destination: Path, max_size: int, quality: int) -> None:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.load()
    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=quality, method=6)


def build_contact_sheet(
    selections: list[tuple[dict[str, object], Path, Path, int]],
    destination: Path,
) -> None:
    cell_width, cell_height = 180, 220
    columns = 6
    rows = (len(selections) + columns - 1) // columns
    sheet = Image.new("RGB", (cell_width * columns, cell_height * rows), "white")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, (product, _, output, score) in enumerate(selections):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        with Image.open(output) as opened:
            thumb = opened.convert("RGBA")
            thumb.thumbnail((160, 160), Image.Resampling.LANCZOS)
        background = Image.new("RGBA", thumb.size, "white")
        background.alpha_composite(thumb)
        sheet.paste(background.convert("RGB"), (x + (cell_width - thumb.width) // 2, y + 4))
        label = f"{product['model']}\n{score}"
        draw.multiline_text((x + 6, y + 170), label[:46], fill="black", font=font, spacing=2)

    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--products", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--contact-sheet", type=Path)
    parser.add_argument("--max-size", type=int, default=1_000)
    parser.add_argument("--quality", type=int, default=84)
    args = parser.parse_args()

    products: list[dict[str, object]] = json.loads(args.products.read_text())
    variants_by_folder: dict[str, set[str]] = defaultdict(set)
    for product in products:
        variants_by_folder[str(product["sourceFolder"])].update(model_variants(product))

    selections: list[tuple[dict[str, object], Path, Path, int]] = []
    for product in products:
        source, score = choose_image(args.source_root, product, variants_by_folder)
        output = args.output_dir / f"{product['id']}-local.webp"
        convert_image(source, output, args.max_size, args.quality)
        selections.append((product, source, output, score))
        print(f"{product['id']}\t{score}\t{source.relative_to(args.source_root)}")

    if args.contact_sheet:
        build_contact_sheet(selections, args.contact_sheet)


if __name__ == "__main__":
    main()
