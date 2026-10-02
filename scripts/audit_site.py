#!/usr/bin/env python3
"""Audit the built static site before switching the production domain."""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path
from build_github_pages import validate_discovery


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
DOMAIN = "www.pavelzosim.com"


class DocumentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, str]] = []
        self.images_without_alt = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for attribute in ("href", "src", "poster"):
            if values.get(attribute):
                self.references.append((attribute, values[attribute] or ""))
        if tag == "img" and not (values.get("alt") or "").strip():
            self.images_without_alt += 1


def local_target(value: str) -> Path | None:
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme in {"mailto", "tel", "data", "javascript"} or value.startswith("#"):
        return None
    if parsed.scheme in {"http", "https"} and parsed.netloc.lower() != DOMAIN:
        return None
    if parsed.netloc and parsed.netloc.lower() != DOMAIN:
        return None
    path = urllib.parse.unquote(parsed.path)
    if not path.startswith("/"):
        return None
    target = SITE / path.lstrip("/")
    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    elif not target.suffix and not target.exists():
        target = target / "index.html"
    return target


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    canonicals: dict[str, str] = {}
    titles: dict[str, str] = {}
    documents = list(SITE.rglob("*.html"))
    for path in documents:
        relative = path.relative_to(SITE).as_posix()
        text = path.read_text(encoding="utf-8")
        if re.search(r"wixstatic|_functions/getPostData|wix\.com/blog/", text, re.I):
            errors.append(f"Wix runtime/reference remains: {relative}")
        parser = DocumentParser()
        parser.feed(text)
        if parser.images_without_alt:
            warnings.append(f"{relative}: {parser.images_without_alt} image(s) without alt")
        for _, value in parser.references:
            target = local_target(value)
            if target is not None and not target.exists():
                errors.append(f"Broken internal reference in {relative}: {value}")
        canonical = re.search(r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', text, re.I)
        if canonical:
            url = canonical.group(1)
            if url in canonicals:
                errors.append(f"Duplicate canonical {url}: {canonicals[url]} and {relative}")
            canonicals[url] = relative
        title = re.search(r"<title>(.*?)</title>", text, re.I | re.S)
        if title:
            normalized = re.sub(r"\s+", " ", title.group(1)).strip()
            if normalized in titles:
                warnings.append(f"Duplicate title: {titles[normalized]} and {relative}")
            titles[normalized] = relative

    registry = json.loads((SITE / "content" / "posts" / "index.json").read_text(encoding="utf-8"))
    records = [record for record in registry["records"] if record.get("state") == "published" and record.get("indexable", True)]
    for record in records:
        route = SITE / "post" / record["slug"] / "index.html"
        text = route.read_text(encoding="utf-8")
        for marker in ('name="description"', 'property="og:title"', 'name="twitter:card"', 'application/ld+json', 'data-atlas-analytics', '<h1'):
            if marker not in text:
                errors.append(f"Missing {marker} in post/{record['slug']}")
    tool_registry = json.loads((SITE / "content" / "online-tools" / "index.json").read_text(encoding="utf-8"))
    for record in tool_registry["records"]:
        required = {"id", "title", "slug", "kind", "summary", "localPath", "publicUrl", "image", "imageAlt", "tags", "datePublished", "dateModified", "state", "indexable"}
        if required - record.keys():
            errors.append(f"Incomplete online tool registry: {record.get('id')}")
        if record.get("state") != "published" or not record.get("indexable"):
            continue
        route = SITE / urllib.parse.urlsplit(record["publicUrl"]).path.lstrip("/") / "index.html"
        if not route.exists():
            errors.append(f"Missing online tool route: {record['publicUrl']}")
            continue
        text = route.read_text(encoding="utf-8")
        for marker in ('name="description"', 'property="og:image"', 'name="twitter:image"', 'application/ld+json', 'WebApplication', 'data-atlas-analytics'):
            if marker not in text:
                errors.append(f"Missing {marker} in online tool {record['slug']}")
        if len(re.findall(r"<h1(?:\s|>)", text, re.I)) != 1:
            errors.append(f"Online tool must have one h1: {record['slug']}")
        for payload in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
            try:
                json.loads(payload)
            except ValueError:
                errors.append(f"Invalid online tool JSON-LD: {record['slug']}")
        if not (SITE / record["image"].lstrip("/")).is_file():
            errors.append(f"Missing online tool social image: {record['slug']}")
    sitemap_count = len(re.findall(r"<url>", (SITE / "sitemap.xml").read_text(encoding="utf-8")))
    try:
        validate_discovery()
    except (RuntimeError, OSError) as error:
        errors.append(str(error))

    print(f"Audited {len(documents)} HTML documents, {len(records)} posts, and {sitemap_count} sitemap URLs")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in sorted(set(errors)):
        print(f"ERROR: {error}")
    print(f"Result: {len(set(errors))} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
