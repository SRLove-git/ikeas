#!/usr/bin/env python3
"""Re-cut BUZUD product images into clean transparent-background PNGs.

Pipeline per image in frontend/public/images/products/:
  1. flatten the current PNG onto a white canvas (recovers a white-bg source)
  2. segment the product with rembg (default model: isnet-general-use)
  3. write the RGBA result (same canvas size) to the output directory

Usage:
  scripts/.venv/bin/python scripts/recut-product-images.py [model] [out_dir]

Defaults: model=u2net (isnet-general-use and birefnet-general performed worse
on the BUZUD set: isnet eats light-colored product faces, birefnet's model is
a ~1 GB download). Out_dir defaults to frontend/public/images/products-recut.
The first run downloads the ONNX model (~170 MB) to ~/.u2net/.
"""

import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "public" / "images" / "products"

MODEL = sys.argv[1] if len(sys.argv) > 1 else "u2net"
DST = Path(sys.argv[2]) if len(sys.argv) > 2 else SRC.parent / "products-recut"


def flatten_on_white(img: Image.Image) -> Image.Image:
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, img.convert("RGBA")).convert("RGB")


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    session = new_session(MODEL)
    for path in sorted(SRC.glob("buzud-*.png")):
        flat = flatten_on_white(Image.open(path))
        out = remove(flat, session=session, post_process_mask=True)
        out.save(DST / path.name)
        print(f"{path.name} -> {DST} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
