#!/usr/bin/env python3
"""Sync storefront images to Aliyun OSS and rewrite references.

What it does:
  1. Uploads every file under frontend/public/images/** to the OSS bucket,
     preserving the `images/...` key so the public URL keeps the same path.
  2. Downloads the category images still pointing at imgcdn2.buzud.com,
     uploads them under `images/categories/<basename>`.
  3. Rewrites image references in frontend/src/data/*.json and the few
     components that hardcode `/images/...` to absolute OSS URLs.

Credentials are read from environment variables (never stored in this file):
  OSS_ENDPOINT, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET,
  OSS_PUBLIC_URL_BASE

Usage:
  python oss-sync.py --dry-run
  python oss-sync.py
"""

import argparse
import concurrent.futures
import json
import mimetypes
import os
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import oss2


FRONTEND = Path(__file__).resolve().parents[1] / "frontend"
PUBLIC = FRONTEND / "public"
IMAGES_DIR = PUBLIC / "images"
DATA_DIR = FRONTEND / "src" / "data"

REMOTE_IMG_HOST = "imgcdn2.buzud.com"

CODE_FILES_WITH_IMAGES = [
    FRONTEND / "src" / "app" / "not-found.tsx",
    FRONTEND / "src" / "components" / "CollectionPanel.tsx",
    FRONTEND / "src" / "components" / "Header.tsx",
]


def get_bucket():
    endpoint = os.environ.get("OSS_ENDPOINT", "https://oss-ap-southeast-1.aliyuncs.com")
    bucket_name = os.environ.get("OSS_BUCKET", "medical-sg")
    access_key_id = os.environ.get("OSS_ACCESS_KEY_ID")
    access_key_secret = os.environ.get("OSS_ACCESS_KEY_SECRET")
    if not access_key_id or not access_key_secret:
        raise SystemExit("Missing OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET")
    auth = oss2.Auth(access_key_id, access_key_secret)
    return oss2.Bucket(auth, endpoint, bucket_name)


def public_base():
    return os.environ.get(
        "OSS_PUBLIC_URL_BASE",
        "https://medical-sg.oss-ap-southeast-1.aliyuncs.com",
    ).rstrip("/")


def content_type(path: Path) -> str:
    guessed = mimetypes.guess_type(path.name)[0]
    return guessed or "application/octet-stream"


def collect_local_files():
    items = []
    for path in sorted(IMAGES_DIR.rglob("*")):
        if not path.is_file():
            continue
        if path.name in {".DS_Store", ".gitkeep"}:
            continue
        key = path.relative_to(PUBLIC).as_posix()
        items.append((path, key))
    return items


def collect_remote_urls():
    urls = set()
    for data_file in DATA_DIR.rglob("*.json"):
        text = data_file.read_text(encoding="utf-8")
        for m in re.finditer(r"https?://[^\"'\\ ]+", text):
            url = m.group(0).rstrip(".,;)]}")
            if REMOTE_IMG_HOST in urlparse(url).netloc:
                urls.add(url)
    return sorted(urls)


def remote_to_key(url: str) -> str:
    path = urlparse(url).path
    basename = Path(path).name
    if not basename or not re.search(r"\.(jpe?g|png|webp|gif)$", basename, re.I):
        basename = os.path.basename(path) or "image"
    return f"images/categories/{basename}"


def upload_file(bucket, local_path: Path, key: str):
    ctype = content_type(local_path)
    bucket.put_object_from_file(
        key, str(local_path), headers={"Content-Type": ctype}
    )
    return key


def upload_remote(bucket, url: str):
    key = remote_to_key(url)
    req = urllib.request.Request(url, headers={"User-Agent": "oss-sync/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    ctype = resp.headers.get("Content-Type") or mimetypes.guess_type(key)[0] or "application/octet-stream"
    bucket.put_object(key, data, headers={"Content-Type": ctype})
    return url, key


def rewrite_references(remote_map):
    base = public_base()
    replacements = [(url, f"{base}/{key}") for url, key in remote_map.items()]

    json_files = sorted(DATA_DIR.rglob("*.json"))
    targets = json_files + CODE_FILES_WITH_IMAGES

    changed = 0
    for target in targets:
        text = target.read_text(encoding="utf-8")
        new_text = text.replace("/images/", f"{base}/images/")
        for old, new in replacements:
            new_text = new_text.replace(old, new)
        if new_text != text:
            target.write_text(new_text, encoding="utf-8")
            changed += 1

    # Verify rewritten JSON stays valid.
    for data_file in json_files:
        json.loads(data_file.read_text(encoding="utf-8"))
    return changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--upload", action="store_true", help="upload local images")
    parser.add_argument("--remote", action="store_true", help="download+upload remote images")
    parser.add_argument("--rewrite", action="store_true", help="rewrite references")
    args = parser.parse_args()

    do_all = not (args.upload or args.remote or args.rewrite)
    local_files = collect_local_files()
    remote_urls = collect_remote_urls()

    print(f"Local images to upload: {len(local_files)}")
    print(f"Remote category images to migrate: {len(remote_urls)}")

    if args.dry_run:
        for _, key in local_files[:10]:
            print("  local", key)
        for url in remote_urls[:10]:
            print("  remote", url, "->", remote_to_key(url))
        print("dry-run done")
        return

    bucket = get_bucket()

    if do_all or args.upload:
        print("Uploading local images...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futs = [ex.submit(upload_file, bucket, p, k) for p, k in local_files]
            for i, fut in enumerate(concurrent.futures.as_completed(futs), 1):
                fut.result()
                if i % 20 == 0 or i == len(futs):
                    print(f"  {i}/{len(futs)}")

    remote_map = {}
    if do_all or args.remote:
        print("Migrating remote category images...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futs = [ex.submit(upload_remote, bucket, u) for u in remote_urls]
            for i, fut in enumerate(concurrent.futures.as_completed(futs), 1):
                url, key = fut.result()
                remote_map[url] = key
                if i % 10 == 0 or i == len(futs):
                    print(f"  {i}/{len(futs)}")
    else:
        # When only rewriting, still build the mapping without uploading.
        remote_map = {u: remote_to_key(u) for u in remote_urls}

    if do_all or args.rewrite:
        print("Rewriting references...")
        n = rewrite_references(remote_map)
        print(f"  rewrote {n} files")

    print("done")


if __name__ == "__main__":
    main()
