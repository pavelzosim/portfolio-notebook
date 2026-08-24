#!/usr/bin/env python3
"""Build a GitHub Pages preview without changing production source paths."""

from __future__ import annotations

import argparse
import re
import shutil
import urllib.parse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
SITE_DIRECTORIES = ("blog", "content", "privacy", "projects", "public", "styles", "tools")
SITE_FILES = ("index.html", "404.html", "home.css")
TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".xml", ".txt"}


def normalized_base_path(value: str) -> str:
    if not value or value == "/":
        return ""
    return "/" + value.strip("/")


def add_noindex(document: str) -> str:
    if re.search(r'<meta\s+name=["\']robots["\']', document, re.IGNORECASE):
        return document
    return re.sub(
        r"(<head(?:\s[^>]*)?>)",
        r'\1<meta name="robots" content="noindex, nofollow">',
        document,
        count=1,
        flags=re.IGNORECASE,
    )


def add_analytics(document: str) -> str:
    if 'data-atlas-analytics' in document:
        return document
    analytics_assets = ''
    if '11-atlas-consent.css' not in document:
        analytics_assets += '<link rel="stylesheet" href="/styles/framework/11-atlas-consent.css?v=1">'
    analytics_assets += '<script src="/scripts/analytics.js?v=1" defer data-atlas-analytics></script>'
    return re.sub(
        r"</head>",
        analytics_assets + "</head>",
        document,
        count=1,
        flags=re.IGNORECASE,
    )


def rewrite_root_paths(text: str, base_path: str, suffix: str) -> str:
    if not base_path:
        return text
    if suffix in {".html", ".xml"}:
        text = re.sub(
            r'((?:href|src|poster|action)\s*=\s*["\'])/(?!/)',
            rf"\1{base_path}/",
            text,
            flags=re.IGNORECASE,
        )
    elif suffix == ".json":
        text = re.sub(r'(:\s*["\'])/(?!/)', rf"\1{base_path}/", text)
    elif suffix == ".js":
        text = re.sub(r'(fetch\(\s*["\'])/(?!/)', rf"\1{base_path}/", text)
    elif suffix == ".css":
        text = re.sub(r'(url\(\s*["\']?)/(?!/)', rf"\1{base_path}/", text, flags=re.IGNORECASE)
    return text


def copy_site() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    for name in SITE_DIRECTORIES:
        source = ROOT / name
        if source.exists():
            shutil.copytree(source, OUTPUT / name)
    for name in SITE_FILES:
        shutil.copy2(ROOT / name, OUTPUT / name)
    scripts_output = OUTPUT / "scripts"
    scripts_output.mkdir()
    for source in (ROOT / "scripts").glob("*.js"):
        shutil.copy2(source, scripts_output / source.name)


def transform_site(base_path: str, noindex: bool) -> None:
    for path in OUTPUT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".html":
            text = add_analytics(text)
            if noindex:
                text = add_noindex(text)
        text = rewrite_root_paths(text, base_path, path.suffix.lower())
        path.write_text(text, encoding="utf-8", newline="\n")
    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")


def validate_site(base_path: str, noindex: bool) -> None:
    missing: set[str] = set()
    html_documents = 0
    for path in OUTPUT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if path.is_relative_to(OUTPUT / "content" / "migration"):
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".html" and re.search(r"<head(?:\s|>)", text, re.IGNORECASE):
            html_documents += 1
            if 'data-atlas-analytics' not in text:
                raise RuntimeError(f"Missing analytics loader in {path.relative_to(OUTPUT)}")
            if noindex and 'name="robots" content="noindex, nofollow"' not in text:
                raise RuntimeError(f"Missing noindex in {path.relative_to(OUTPUT)}")
        if not base_path:
            continue
        pattern = re.compile(re.escape(base_path) + r"/([^\"'()\s?#]*)")
        for match in pattern.finditer(text):
            relative = urllib.parse.unquote(match.group(1))
            target = OUTPUT / relative
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                missing.add(relative or "index.html")
    if missing:
        raise RuntimeError("Missing Pages targets: " + ", ".join(sorted(missing)))
    print(f"Validated {html_documents} HTML documents and all prefixed local paths")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-path", default="/portfolio-notebook")
    parser.add_argument("--noindex", action="store_true")
    args = parser.parse_args()
    base_path = normalized_base_path(args.base_path)
    copy_site()
    transform_site(base_path, args.noindex)
    validate_site(base_path, args.noindex)
    print(f"Built {OUTPUT} with base path {base_path or '/'}; noindex={args.noindex}")


if __name__ == "__main__":
    main()
