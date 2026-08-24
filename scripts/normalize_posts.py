#!/usr/bin/env python3
"""Normalize all migrated post records and SEO heads for production."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "content" / "posts" / "index.json"
DOMAIN = "https://www.pavelzosim.com"
CANONICAL_OVERRIDES = {
    "REF-001": f"{DOMAIN}/post/unity-shaderlab-cheatsheet",
    "TOOL-002": f"{DOMAIN}/post/houdini-tool-folder-based-file-importer",
    "TOOL-003": f"{DOMAIN}/post/houdini-tool-material-path-manager",
    "TOOL-005": f"{DOMAIN}/post/procedural-skeleton-houdini",
}


def escape(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def first_match(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.I | re.S)
    return html.unescape(match.group(1)).strip() if match else ""


def representative_image(record: dict, text: str) -> str:
    image = record.get("image") or first_match(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', text)
    if not image:
        image = first_match(r'<img[^>]+src=["\']([^"\']+)', text)
    return DOMAIN + image if image.startswith("/") else image


def published_date(record: dict, text: str) -> str:
    if record.get("datePublished"):
        return record["datePublished"]
    value = first_match(r"created\s*:\s*['\"]([0-9]{4}[.\-][0-9]{2}[.\-][0-9]{2})", text)
    if not value:
        value = first_match(r'<div class="post-meta">.*?<span>([0-9]{4}-[0-9]{2}-[0-9]{2})</span>', text)
    return value.replace(".", "-") if value else ""


def replace_head(text: str, record: dict) -> str:
    title = record["title"].strip()
    description = re.sub(r"\s+", " ", record.get("summary", "")).strip()[:300]
    canonical = record["publicUrl"]
    image = representative_image(record, text)
    published = record.get("datePublished", "")
    modified = record.get("dateModified") or published
    json_ld = json.dumps({
        "@context": "https://schema.org", "@type": "BlogPosting", "headline": title,
        "description": description, "url": canonical, "mainEntityOfPage": canonical,
        "image": image or None, "datePublished": published or None, "dateModified": modified or None,
        "author": {"@type": "Person", "name": "Pavel Zosim", "url": DOMAIN + "/"},
    }, ensure_ascii=False).replace("</", "<\\/")
    text = re.sub(r"<title>.*?</title>", "", text, flags=re.I | re.S)
    text = re.sub(r'<link\b[^>]*rel=["\']canonical["\'][^>]*>', "", text, flags=re.I)
    text = re.sub(r'<meta\b[^>]*(?:name=["\'](?:description|twitter:[^"\']+)["\']|property=["\']og:[^"\']+["\'])[^>]*>', "", text, flags=re.I)
    text = re.sub(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>', "", text, flags=re.I | re.S)
    image_meta = f'<meta property="og:image" content="{escape(image)}"><meta name="twitter:image" content="{escape(image)}">' if image else ""
    metadata = (
        f'<title>{html.escape(title)} · Pavel Zosim</title><meta name="description" content="{escape(description)}">'
        f'<link rel="canonical" href="{escape(canonical)}"><meta property="og:type" content="article">'
        f'<meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}">'
        f'<meta property="og:url" content="{escape(canonical)}">{image_meta}<meta name="twitter:card" content="summary_large_image">'
        f'<meta name="twitter:title" content="{escape(title)}"><meta name="twitter:description" content="{escape(description)}">'
        f'<script type="application/ld+json">{json_ld}</script>'
    )
    text = re.sub(r"(<meta\s+name=[\"']viewport[\"'][^>]*>)", r"\1" + metadata, text, count=1, flags=re.I)
    if not re.search(r"<h1(?:\s|>)", text, re.I):
        text = re.sub(r"(<body\b[^>]*>)", r'\1<h1 class="seo-heading">' + html.escape(title) + "</h1>", text, count=1, flags=re.I)
    return text


def remove_wix_runtime(text: str) -> str:
    """Remove metadata fetches that only worked inside the former Wix site."""
    text = re.sub(
        r"\(function\s*\([^)]*\)\s*\{(?=.{0,1500}?fetch\s*\(\s*BACKEND_URL)(?:(?!\}\)\s*\(\)\s*;).)*?fetch\s*\(\s*BACKEND_URL.*?\}\)\s*\(\)\s*;",
        "",
        text,
        flags=re.I | re.S,
    )
    text = re.sub(r"^\s*var\s+BACKEND_URL\s*=\s*['\"][^'\"]+['\"]\s*;\s*$", "", text, flags=re.I | re.M)
    text = text.replace("https://www.pavelzosim.com/blog/tags/", "/blog/?tag=")
    text = text.replace("https://www.pavelzosim.com/blog/hashtags/pragma", "/blog/?tag=pragma")
    text = text.replace("https://www.pavelzosim.com/post/from-file-to-pixel\"", "/blog/\"")
    return text


def main() -> int:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    changed = 0
    for record in registry["records"]:
        local_path = record.get("localPath", "").lstrip("/")
        if not local_path:
            continue
        path = ROOT / local_path
        if not path.exists():
            raise FileNotFoundError(path)
        text = path.read_text(encoding="utf-8")
        canonical = CANONICAL_OVERRIDES.get(record.get("id")) or record.get("publicUrl") or record.get("sourceUrl")
        if not canonical:
            canonical = first_match(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', text)
        if not canonical:
            raise RuntimeError(f"Missing canonical URL for {path}")
        record["sourceUrl"] = canonical
        record["publicUrl"] = canonical
        record["slug"] = urlparse(canonical).path.rstrip("/").split("/")[-1]
        record["imageAlt"] = record.get("imageAlt") or record["title"]
        record["datePublished"] = published_date(record, text)
        record["dateModified"] = record.get("dateModified") or record["datePublished"]
        record["state"] = "published"
        record["indexable"] = True
        normalized = replace_head(remove_wix_runtime(text), record)
        normalized = "\n".join(line.rstrip() for line in normalized.splitlines()) + "\n"
        if normalized != text:
            path.write_text(normalized, encoding="utf-8", newline="\n")
            changed += 1
    REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"Normalized {changed} post documents and {len(registry['records'])} registry records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
