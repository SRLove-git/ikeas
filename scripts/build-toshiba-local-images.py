#!/usr/bin/env python3
"""Build lightweight local Toshiba product images from the archived source folders."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_SUFFIXES = {".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}
PREFERRED_PATH_WORDS = (
    "highrespics",
    "pics",
    "photo",
    "productimage",
    "产品图",
    "商品图",
    "白底",
    "高清图",
)
DISFAVORED_PATH_WORDS = (
    "certificate",
    "certification",
    "featureimage",
    "installation",
    "launchmemo",
    "manual",
    "packaging",
    "parameter",
    "pop",
    "scenario",
    "specification",
    "video",
    "丝印",
    "包材",
    "参数",
    "安装",
    "场景",
    "认证",
    "说明书",
    "视频",
    "销售话术",
)
DISFAVORED_FILE_WORDS = (
    "barcode",
    "certificate",
    "detail",
    "icon",
    "label",
    "logo",
    "qrcode",
    "sticker",
    "tick",
    "二维码",
    "局部",
    "标签",
    "细节",
    "认证",
)

FOLDER_OVERRIDES = {
    "toshiba-tw-t37bzp105mws-wt": "LAD/Japandi series/T37 washer",
    "toshiba-td-t37bs80hws-wt": "LAD/Japandi series/T37 dryer",
    "toshiba-twd-t39bzu120mws-wt": "LAD/Japandi series/T39 combo",
    "toshiba-twd-t40bzu110mws-wt": "LAD/Japandi series/T40 laundry station",
    "toshiba-tw-t40bzp110mws-wt": "LAD/Japandi series/T40 laundry station",
    "toshiba-td-t40bs90hws-wt": "LAD/Japandi series/T40 laundry station",
    "toshiba-aw-duk1150hs-mg-ww": "LAD/全自动/T06 series 3 tick",
    "toshiba-aw-j900ds": "LAD/全自动/T06 series 3 tick",
    "toshiba-aw-j1000fs": "LAD/全自动/T06 series 3 tick",
    "toshiba-aw-dj1000fs": "LAD/全自动/T06 series 3 tick",
    "toshiba-aw-duk1300ks-mk": "LAD/全自动/T06 series 4 tick/T06 AW-DUK1300KS(MK) Original Inverter motor",
    "toshiba-aw-t26d1400ts-mg": "LAD/全自动/T26 back panel series/T26 13KG",
    "toshiba-aw-t26d1600xs-mg": "LAD/全自动/T26 back panel series/T26 15KG",
    "toshiba-t25-series": "LAD/干衣机/T25 series",
    "toshiba-t33-series": "LAD/干衣机/T33 series",
    "toshiba-twd-bl160d4s": "LAD/滚筒/T20 series",
    "toshiba-tw-t21bu140uws-mg": "LAD/滚筒/T21 series 13KG WASHER& COMBO",
    "toshiba-tw-t21bu140uws-mg-2": "LAD/滚筒/T21 series 13KG WASHER& COMBO",
    "toshiba-tw-t23bu95uws": "LAD/滚筒/T23 series same with T15",
    "toshiba-tw-t25bzp140mws-mg": "LAD/滚筒/T25 Series",
    "toshiba-twd-t25bzp140mws-mg": "LAD/滚筒/T25 Series",
    "toshiba-t25-series-2": "LAD/滚筒/T25 Series",
    "toshiba-t27-10-5kg": "LAD/滚筒/T27 series",
    "toshiba-tw-t33b105uws-ws-wk": "LAD/滚筒/T33 series",
    "toshiba-gr-rm838we-pgx": "REF/Multi/RM838资料",
    "toshiba-gr-rb405we-pmx-06s": "REF/BMF/GR-RB405WE-PMX(06S) 3 TICKS",
    "toshiba-gr-rt559we-pmx-06s": "REF/TMF/GR-RT559WE-PMX(06S）（21S）（22S)",
    "toshiba-gr-rt559we-pmx-21s-22s": "REF/TMF/GR-RT559WE-PMX(06S）（21S）（22S)",
}

IMAGE_OVERRIDES = {
    "toshiba-dw-13f1-g-sg": "高清图/IMG_0892.TIF",
    "toshiba-twh-33exnsg-t": "高清图/显示屏-前视图-不带泵.png",
    "toshiba-twh-33mxpsg-t-cb": (
        "TWH-33MXPSG(T)-CB/产品介绍PPT和说明书/"
        "TWH-33MXPSG(T)-CB PPT.pptx!ppt/media/image13.png"
    ),
    "toshiba-tw-t37bzp105mws-wt": "Pics/T37-1.png",
    "toshiba-td-t37bs80hws-wt": "High res pics/T37-1.png",
    "toshiba-aw-j900ds": "产品高清图/T06 高清图片/T06 - White/IMG_6356-ok副本.jpg",
    "toshiba-aw-j1000fs": "产品高清图/T06 高清图片/T06 - White/IMG_6356-ok副本.jpg",
    "toshiba-aw-dj1000fs": "产品高清图/T06 高清图片/T06 - White/IMG_6356-ok副本.jpg",
    "toshiba-aw-duk1150hs-mg-ww": "产品高清图/T06 高清图片/T06 - White/IMG_6356-ok副本.jpg",
    "toshiba-td-t37bs100hws-wt": "Pics/T37-1.png",
    "toshiba-tw-t37bzp140mws-wt": "PICS/Product Pictures/T37-1.png",
    "toshiba-ml-ec42s-bs": "产品高清图/Product Picture.jpg",
    "toshiba-ml2-eg30pe-bs": "photo/1.jpg",
    "toshiba-mw3-em20pe-bk": "产品高清图/1 拷贝.jpg",
    "toshiba-gr-rm593we-pgx-b3": "高清图/jpg/_84A3017UI位置 副本.JPG",
    "toshiba-gr-rt735we-pgx": "高清图/735-玻璃门-黑色-.png",
    "toshiba-gr-rt835we-pgx": "高清图/835-玻璃门-黑色-.png",
    "toshiba-kt-15drtsg-w-h": "产品图片/B01.png",
}


@dataclass(frozen=True)
class ArchiveImage:
    archive: Path
    member: str


def compact(value: str) -> str:
    return "".join(character.casefold() for character in value if character.isalnum())


def model_variants(product: dict[str, object]) -> set[str]:
    values = {compact(str(product["model"])), compact(str(product["id"]).removeprefix("toshiba-"))}
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


def image_info_bytes(data: bytes) -> tuple[int, int, bool] | None:
    try:
        with Image.open(BytesIO(data)) as image:
            width, height = image.size
            has_alpha = image.mode in {"LA", "RGBA"} or "transparency" in image.info
            return width, height, has_alpha
    except (Image.DecompressionBombError, OSError, ValueError):
        return None


def find_product_folder(
    source_root: Path,
    product: dict[str, object],
    directories: list[Path],
) -> Path:
    product_id = str(product["id"])
    override = FOLDER_OVERRIDES.get(product_id)
    if override:
        folder = source_root / override
        if not folder.is_dir():
            raise RuntimeError(f"Invalid folder override for {product_id}: {folder}")
        return folder

    variants = model_variants(product)
    scored: list[tuple[int, Path]] = []
    for folder in directories:
        relative = folder.relative_to(source_root)
        name = compact(folder.name)
        relative_text = compact(str(relative))
        exact = any(name == variant for variant in variants)
        name_match = any(variant in name or name in variant for variant in variants if len(name) >= 5)
        path_match = any(variant in relative_text for variant in variants)
        if not (exact or name_match or path_match):
            continue
        score = (1_500 if exact else 900 if name_match else 500) - len(relative.parts) * 30
        score -= len(str(relative)) // 10
        scored.append((score, folder))

    if not scored:
        raise RuntimeError(f"No source folder matched {product_id} ({product['model']})")
    return max(scored, key=lambda item: (item[0], -len(str(item[1]))))[1]


def score_candidate(
    relative: Path,
    variants: set[str],
    info: tuple[int, int, bool],
) -> int:
    relative_text = compact(str(relative))
    stem_text = compact(relative.stem)
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
    if any(word in stem_text for word in ("front", "hero", "main", compact("正面"), compact("正视"))):
        score += 260
    if any(word in stem_text for word in ("closed", compact("关门"))):
        score += 120
    if any(
        word in stem_text
        for word in ("back", "bottom", "inside", "left", "right", "side", "top", compact("内胆"), compact("侧面"))
    ):
        score -= 160

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
    if 0.45 <= ratio <= 2.0:
        score += 50
    else:
        score -= 120
    if has_alpha:
        score += 25

    score -= len(relative.parts) * 2
    return score


def choose_image(folder: Path, product: dict[str, object]) -> tuple[Path | ArchiveImage, int]:
    product_id = str(product["id"])
    override = IMAGE_OVERRIDES.get(product_id)
    if override:
        if "!" in override:
            archive_name, member = override.split("!", 1)
            archive = folder / archive_name
            if not archive.is_file():
                raise RuntimeError(f"Invalid image archive override for {product_id}: {archive}")
            try:
                with zipfile.ZipFile(archive) as opened:
                    info = image_info_bytes(opened.read(member))
            except (KeyError, OSError, zipfile.BadZipFile) as error:
                raise RuntimeError(
                    f"Invalid image member override for {product_id}: {override}"
                ) from error
            if info is None:
                raise RuntimeError(f"Unreadable image member override for {product_id}: {override}")
            return ArchiveImage(archive, member), 10_000

        image = folder / override
        if not image.is_file() or image_info(image) is None:
            raise RuntimeError(f"Invalid image override for {product_id}: {image}")
        return image, 10_000

    variants = model_variants(product)
    candidates: list[tuple[int, Path | ArchiveImage]] = []
    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        info = image_info(path)
        if info is None:
            continue
        relative = path.relative_to(folder)
        candidates.append((score_candidate(relative, variants, info), path))

    if not candidates:
        for archive in folder.rglob("*"):
            if not archive.is_file() or archive.suffix.lower() not in {".docx", ".pptx", ".zip"}:
                continue
            try:
                with zipfile.ZipFile(archive) as opened:
                    for member in opened.namelist():
                        member_path = Path(member)
                        if member_path.suffix.lower() not in IMAGE_SUFFIXES:
                            continue
                        data = opened.read(member)
                        info = image_info_bytes(data)
                        if info is None:
                            continue
                        relative = Path(f"{archive.relative_to(folder)}!{member}")
                        candidates.append(
                            (score_candidate(relative, variants, info), ArchiveImage(archive, member))
                        )
            except (OSError, ValueError, zipfile.BadZipFile):
                continue

    if not candidates:
        raise RuntimeError(f"No readable images found for {product['id']} in {folder}")
    score, source = max(
        candidates,
        key=lambda item: (item[0], -len(source_label(item[1], folder)), source_label(item[1], folder)),
    )
    return source, score


def source_label(source: Path | ArchiveImage, folder: Path) -> str:
    if isinstance(source, ArchiveImage):
        return f"{source.archive.relative_to(folder)}!{source.member}"
    return str(source.relative_to(folder))


def convert_image(
    source: Path | ArchiveImage,
    destination: Path,
    max_size: int,
    quality: int,
) -> None:
    if isinstance(source, ArchiveImage):
        with zipfile.ZipFile(source.archive) as archive:
            image_data = archive.read(source.member)
        opened_source: Path | BytesIO = BytesIO(image_data)
    else:
        opened_source = source
    with Image.open(opened_source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.load()
    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=quality, method=6)


def build_contact_sheet(
    selections: list[tuple[dict[str, object], Path, Path | ArchiveImage, Path, int]],
    destination: Path,
) -> None:
    cell_width, cell_height = 180, 220
    columns = 6
    rows = (len(selections) + columns - 1) // columns
    sheet = Image.new("RGB", (cell_width * columns, cell_height * rows), "white")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, (product, _, _, output, score) in enumerate(selections):
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
    directories = [path for path in args.source_root.rglob("*") if path.is_dir()]
    selections: list[tuple[dict[str, object], Path, Path | ArchiveImage, Path, int]] = []
    for product in products:
        folder = find_product_folder(args.source_root, product, directories)
        source, score = choose_image(folder, product)
        output = args.output_dir / f"{product['id']}-local.webp"
        convert_image(source, output, args.max_size, args.quality)
        selections.append((product, folder, source, output, score))
        print(
            f"{product['id']}\t{score}\t{folder.relative_to(args.source_root)}"
            f"\t{source_label(source, folder)}"
        )

    if args.contact_sheet:
        build_contact_sheet(selections, args.contact_sheet)


if __name__ == "__main__":
    main()
