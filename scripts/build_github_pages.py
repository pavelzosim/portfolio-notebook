#!/usr/bin/env python3
"""Build a GitHub Pages preview without changing production source paths."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import urllib.parse
from xml.sax.saxutils import escape as xml_escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
SITE_DIRECTORIES = ("blog", "content", "privacy", "projects", "public", "styles", "tools")
SITE_FILES = ("index.html", "404.html", "home.css", "CNAME")
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


def materialize_post_routes() -> list[dict]:
    registry_path = OUTPUT / "content" / "posts" / "index.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    records = [record for record in registry["records"] if record.get("state") == "published" and record.get("indexable", True)]
    urls: set[str] = set()
    slugs: set[str] = set()
    for record in records:
        slug = record["slug"]
        public_url = record["publicUrl"]
        if slug in slugs or public_url in urls:
            raise RuntimeError(f"Duplicate post route: {slug} / {public_url}")
        slugs.add(slug)
        urls.add(public_url)
        source = OUTPUT / record["localPath"].lstrip("/")
        if not source.exists():
            raise RuntimeError(f"Missing post source: {record['localPath']}")
        destination = OUTPUT / "post" / slug / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        record["localPath"] = f"/post/{slug}/"
    source_documents = OUTPUT / "content" / "posts" / "atlas-html"
    if source_documents.exists():
        shutil.rmtree(source_documents)
    obsolete_template = OUTPUT / "content" / "templates" / "atlas-post.html"
    if obsolete_template.exists():
        obsolete_template.unlink()
    registry_path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return records


def write_discovery_files(records: list[dict], noindex: bool) -> None:
    domain = "https://www.pavelzosim.com"
    if noindex:
        (OUTPUT / "robots.txt").write_text("User-agent: *\nDisallow:\n", encoding="utf-8", newline="\n")
        return
    urls = [
        (domain + "/", ""), (domain + "/blog/", ""), (domain + "/projects/", ""),
        (domain + "/tools/", ""), (domain + "/privacy/", ""),
    ]
    projects = json.loads((OUTPUT / "content" / "projects" / "index.json").read_text(encoding="utf-8"))["projects"]
    urls.extend((f"{domain}/projects/{project['slug']}/", "") for project in projects)
    urls.extend((record["publicUrl"], record.get("dateModified") or record.get("datePublished") or "") for record in records)
    entries = []
    for location, modified in urls:
        lastmod = f"<lastmod>{xml_escape(modified)}</lastmod>" if modified else ""
        entries.append(f"  <url><loc>{xml_escape(location)}</loc>{lastmod}</url>")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(entries) + "\n</urlset>\n"
    (OUTPUT / "sitemap.xml").write_text(sitemap, encoding="utf-8", newline="\n")
    (OUTPUT / "robots.txt").write_text(f"User-agent: *\nDisallow:\n\nSitemap: {domain}/sitemap.xml\n", encoding="utf-8", newline="\n")


def transform_site(base_path: str, noindex: bool) -> None:
    for path in OUTPUT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".html":
            text = add_analytics(text)
            relative = path.relative_to(OUTPUT).as_posix()
            if noindex or relative.startswith("content/templates/") or relative in {"404.html", "blog/style-guide/index.html"}:
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
    registry = json.loads((OUTPUT / "content" / "posts" / "index.json").read_text(encoding="utf-8"))
    expected_posts = [record for record in registry["records"] if record.get("state") == "published" and record.get("indexable", True)]
    for record in expected_posts:
        route = OUTPUT / "post" / record["slug"] / "index.html"
        document = route.read_text(encoding="utf-8")
        required = (record["publicUrl"], 'data-atlas-analytics', 'application/ld+json', '<h1')
        if any(value not in document for value in required):
            raise RuntimeError(f"Incomplete post metadata: {record['slug']}")
    if not noindex:
        expected_sitemap_urls = len(expected_posts) + 10
        if len(re.findall(r"<url>", (OUTPUT / "sitemap.xml").read_text(encoding="utf-8"))) != expected_sitemap_urls:
            raise RuntimeError("Unexpected sitemap URL count")
        if (OUTPUT / "content" / "posts" / "atlas-html").exists():
            raise RuntimeError("Duplicate source post routes remain in output")
    print(f"Validated {html_documents} HTML documents, {len(expected_posts)} canonical post routes, and discovery files")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-path", default="/")
    parser.add_argument("--noindex", action="store_true")
    args = parser.parse_args()
    base_path = normalized_base_path(args.base_path)
    copy_site()
    records = materialize_post_routes()
    transform_site(base_path, args.noindex)
    write_discovery_files(records, args.noindex)
    validate_site(base_path, args.noindex)
    print(f"Built {OUTPUT} with base path {base_path or '/'}; noindex={args.noindex}")


if __name__ == "__main__":
    main()
