#!/usr/bin/env python3
"""Audit the built static site before switching the production domain."""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path


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
    sitemap_count = len(re.findall(r"<url>", (SITE / "sitemap.xml").read_text(encoding="utf-8")))
    if sitemap_count != 43:
        errors.append(f"Sitemap has {sitemap_count} URLs instead of 43")

    print(f"Audited {len(documents)} HTML documents, {len(records)} posts, and {sitemap_count} sitemap URLs")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in sorted(set(errors)):
        print(f"ERROR: {error}")
    print(f"Result: {len(set(errors))} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
