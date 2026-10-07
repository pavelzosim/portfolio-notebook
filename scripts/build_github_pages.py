#!/usr/bin/env python3
"""Build production or an explicitly noindex GitHub Pages preview."""

from __future__ import annotations

import argparse
from html import escape, unescape
import hashlib
import posixpath
import json
import re
import shutil
import urllib.parse
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape as xml_escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
SITE_DIRECTORIES = ("blog", "content", "privacy", "projects", "public", "styles", "tools", "online-tools")
SITE_FILES = ("index.html", "404.html", "home.css", "CNAME", "favicon.ico")
TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".xml", ".txt"}


def normalized_base_path(value: str) -> str:
    if not value or value == "/":
        return ""
    return "/" + value.strip("/")


def add_noindex(document: str) -> str:
    document = re.sub(r'<meta\b(?=[^>]*\bname=["\']robots["\'])[^>]*>', '', document, flags=re.IGNORECASE)
    return re.sub(
        r"(<head(?:\s[^>]*)?>)",
        r'\1<meta name="robots" content="noindex, nofollow">',
        document,
        count=1,
        flags=re.IGNORECASE,
    )


def add_clock(document: str) -> str:
    if "data-clock" not in document:
        document = re.sub(
            r"SYS\.ONLINE / UTC\+3",
            r'SYS.ONLINE / UTC+3 <span class="clock" data-clock aria-hidden="true">--:--</span>',
            document,
            count=1,
        )
    if "live-clock.js" in document:
        return document
    return re.sub(
        r"</head>",
        '<script src="/scripts/live-clock.js?v=1" defer></script></head>',
        document,
        count=1,
        flags=re.IGNORECASE,
    )


def add_favicon(document: str) -> str:
    if 'rel="icon"' in document or "rel='icon'" in document:
        return document
    favicon_links = (
        '<link rel="icon" href="/favicon.ico" sizes="any">'
        '<link rel="icon" type="image/png" href="/public/media/brand/favicon-32.png" sizes="32x32">'
        '<link rel="icon" type="image/png" href="/public/media/brand/favicon-16.png" sizes="16x16">'
        '<link rel="apple-touch-icon" href="/public/media/brand/favicon-180.png">'
    )
    return re.sub(
        r"(<head(?:\s[^>]*)?>)",
        r"\1" + favicon_links,
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
    analytics_assets += '<script src="/scripts/analytics.js?v=2" defer data-atlas-analytics></script>'
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
    # Authoring scratch record, not the live registry; contains placeholder URLs.
    (OUTPUT / "content" / "posts" / "index-json-entry.json").unlink(missing_ok=True)
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
    # Article chrome must not wait for a second request on a cold cache.
    # Embed only public records, with their final routes already resolved.
    embedded = json.dumps({"records": records}, ensure_ascii=False).replace("<", "\\u003c")
    for record in records:
        destination = OUTPUT / "post" / record["slug"] / "index.html"
        document = destination.read_text(encoding="utf-8")
        if "article-page.js" in document:
            document = re.sub(
                r'(<script\b[^>]*src=["\']/scripts/article-page\.js[^"\']*["\'][^>]*>)',
                lambda match: '<script type="application/json" id="article-registry">'
                + embedded + '</script>' + match.group(1),
                document,
                count=1,
            )
            document = document.replace("article-page.js?v=17", "article-page.js?v=19")
            destination.write_text(document, encoding="utf-8", newline="\n")
    source_documents = OUTPUT / "content" / "posts" / "atlas-html"
    if source_documents.exists():
        shutil.rmtree(source_documents)
    registry_path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return records


def write_discovery_files(records: list[dict], noindex: bool) -> None:
    domain = "https://www.pavelzosim.com"
    if noindex:
        (OUTPUT / "CNAME").unlink(missing_ok=True)
        (OUTPUT / "sitemap.xml").unlink(missing_ok=True)
        (OUTPUT / "robots.txt").write_text("User-agent: *\nDisallow:\n", encoding="utf-8", newline="\n")
        return
    urls = [
        (domain + "/", ""), (domain + "/blog/", ""), (domain + "/projects/", ""),
        (domain + "/tools/", ""), (domain + "/online-tools/", ""), (domain + "/privacy/", ""),
    ]
    tools = json.loads((OUTPUT / "content" / "online-tools" / "index.json").read_text(encoding="utf-8"))["records"]
    urls.extend((tool["publicUrl"], tool.get("dateModified") or tool.get("datePublished") or "") for tool in tools if tool.get("state") == "published" and tool.get("indexable", True))
    projects = json.loads((OUTPUT / "content" / "projects" / "index.json").read_text(encoding="utf-8"))["projects"]
    urls.extend((f"{domain}/projects/{project['slug']}/", "") for project in projects)
    urls.extend((record["publicUrl"], record.get("dateModified") or record.get("datePublished") or "") for record in records)
    entries = []
    seen = set()
    for location, modified in urls:
        if location in seen:
            raise RuntimeError(f"Duplicate sitemap URL: {location}")
        seen.add(location)
        lastmod = f"<lastmod>{xml_escape(modified)}</lastmod>" if modified else ""
        entries.append(f"  <url><loc>{xml_escape(location)}</loc>{lastmod}</url>")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(entries) + "\n</urlset>\n"
    (OUTPUT / "sitemap.xml").write_text(sitemap, encoding="utf-8", newline="\n")
    (OUTPUT / "robots.txt").write_text(f"User-agent: *\nDisallow:\n\nSitemap: {domain}/sitemap.xml\n", encoding="utf-8", newline="\n")


def reuse_identical_media() -> None:
    """Use one URL per identical asset while retaining existing public URLs."""
    hashes: dict[str, str] = {}
    aliases: dict[str, str] = {}
    for asset in sorted((OUTPUT / "public").rglob("*")):
        if not asset.is_file():
            continue
        digest = hashlib.sha256(asset.read_bytes()).hexdigest()
        url = "/" + asset.relative_to(OUTPUT).as_posix()
        if digest in hashes:
            aliases[url] = hashes[digest]
        else:
            hashes[digest] = url
    for page in OUTPUT.rglob("*"):
        if page.is_file() and page.suffix.lower() in TEXT_SUFFIXES:
            text = page.read_text(encoding="utf-8")
            changed = text
            for alias, canonical in aliases.items():
                changed = changed.replace(alias, canonical)
            if changed != text:
                page.write_text(changed, encoding="utf-8", newline="\n")


def render_index_template(template: str, view: str, records: list[dict], document: str) -> str:
    """Keep catalogue links and content available before JavaScript executes."""
    if view == "tools":
        records = [record for record in records if record.get("resource")]
    records = sorted(records, key=lambda record: record.get("siteDate") or record.get("datePublished") or "", reverse=True)
    cards = []
    for record in records:
        project = view == "projects"
        href = f"/projects/{record['slug']}/" if project else record["localPath"]
        kind = "project" if project else record["kind"]
        state = record.get("status", "published") if project else record["state"]
        tags = ([tag.strip().lower() for tag in record["type"].split("/") + record["tools"][:3]]
                if project else record.get("tags", []))
        image = ('<img src="' + escape(record["image"], quote=True) + '" alt="'
                 + escape(record.get("imageAlt") or record["title"] + " preview", quote=True)
                 + '" loading="lazy">') if record.get("image") else '<span>NO PREVIEW</span>'
        awards = record.get("awards", [])
        awards_html = ('<div class="content-project-awards">' + ''.join('<span>' + escape(award["label"]) + '</span>' for award in awards) + '</div>') if awards else ''
        cards.append(
            '<a class="content-record" role="listitem" href="' + escape(href, quote=True) + '">'
            '<div class="content-preview">' + image + '</div><div class="content-record-body">'
            '<div class="content-record-meta"><span class="record-id">' + escape(record["id"]) + '</span>'
            '<span class="record-kind">' + escape(kind.upper()) + '</span></div><strong>'
            + escape(record["title"]) + '</strong><p>' + escape(record["summary"]) + '</p>' + awards_html
            + '<div class="content-tags">' + ''.join('<span>#' + escape(tag) + '</span>' for tag in tags)
            + '</div></div><div class="content-state ' + escape(state.lower(), quote=True) + '"><span>'
            + escape(state) + '</span><b>OPEN →</b></div></a>'
        )
    template = template.replace('<div class="content-log" data-records role="list"></div>',
                                '<div class="content-log" data-records role="list">' + ''.join(cards) + '</div>')
    title = unescape(re.search(r'<title>(.*?)</title>', document, re.S).group(1)).removesuffix(' / Pavel Zosim')
    description = unescape(re.search(r'<meta name="description" content="([^"]*)"', document).group(1))
    for marker, value in (("data-index-title", title), ("data-index-dek", description),
                          ("data-list-title", title), ("data-list-count", f"{len(records):02} RECORDS"),
                          ("data-search-output", f"{len(records):02} records"), ("data-meta-count", f"{len(records):02}")):
        template = re.sub(r'(<[^>]+\b' + marker + r'[^>]*>)[^<]*', lambda match: match.group(1) + escape(value), template)
    return template


def prepare_static_loading(records: list[dict]) -> None:
    """Embed catalogue inputs and flatten local CSS imports for a cold load."""
    posts = json.dumps({"records": records}, ensure_ascii=False).replace("<", "\\u003c")
    template = (OUTPUT / "content/templates/content-index.html").read_text(encoding="utf-8")
    for page in OUTPUT.rglob("*.html"):
        document = page.read_text(encoding="utf-8")
        if "post-registry.js" in document:
            document = document.replace("</head>", '<script type="application/json" id="site-post-registry">' + posts + '</script></head>', 1)
            document = document.replace("post-registry.js?v=2", "post-registry.js?v=3")
        view = re.search(r'data-content-index=["\']([^"\']+)', document)
        if view:
            data = posts if view.group(1) != "projects" else (OUTPUT / "content/projects/index.json").read_text(encoding="utf-8").replace("<", "\\u003c")
            index_records = records if view.group(1) != "projects" else json.loads(data)["projects"]
            rendered = render_index_template(template, view.group(1), index_records, document)
            document = re.sub(r'(<body\b[^>]*>)', lambda match: match.group(1) + rendered + '<script type="application/json" id="site-index-registry">' + data + '</script>', document, count=1)
            document = document.replace("content-index.js?v=8", "content-index.js?v=9")
        # One request per local stylesheet entry instead of serial @import chains.
        seen: set[Path] = set()
        def flatten(css_path: Path) -> str:
            css_path = css_path.resolve()
            if not css_path.is_relative_to(OUTPUT.resolve()):
                raise RuntimeError(f"CSS outside output: {css_path}")
            if css_path in seen:
                return ""
            seen.add(css_path)
            css = css_path.read_text(encoding="utf-8")
            def imported(match):
                url = match.group(1)
                if url.startswith(("https:", "http:", "//")):
                    return match.group(0)
                target = OUTPUT / url.lstrip("/").split("?")[0] if url.startswith("/") else css_path.parent / url.split("?")[0]
                return flatten(target)
            # Rebase assets before expanding imports so imported assets retain their own base.
            def asset(match):
                url = match.group(2)
                if url.startswith(("/", "data:", "https:", "http:", "#")):
                    return match.group(0)
                resolved = posixpath.normpath('/' + css_path.parent.relative_to(OUTPUT.resolve()).as_posix() + '/' + url)
                return 'url("' + resolved + '")'
            css = re.sub(r'url\((["\']?)([^)"\']+)\1\)', asset, css)
            css = re.sub(r'@import\s+url\(["\']([^"\']+)["\']\)\s*;', imported, css)
            return css
        def stylesheet(match):
            tag = match.group(0)
            if not re.search(r'rel=["\']stylesheet["\']', tag):
                return tag
            href = re.search(r'href=["\']([^"\']+)["\']', tag)
            if not href or href.group(1).startswith(("https:", "http:", "//")):
                return tag
            url = href.group(1)
            target = OUTPUT / url.lstrip("/").split("?")[0] if url.startswith("/") else page.parent / url.split("?")[0]
            css = flatten(target)
            if not css.strip():
                return ""
            name = hashlib.sha256(css.encode()).hexdigest()[:16] + '.css'
            bundle = OUTPUT / 'styles/bundles' / name
            bundle.parent.mkdir(parents=True, exist_ok=True)
            bundle.write_text(css, encoding='utf-8')
            return tag.replace(url, '/styles/bundles/' + name)
        document = re.sub(r'<link\b[^>]*>', stylesheet, document)
        page.write_text(document, encoding="utf-8", newline="\n")


def transform_site(base_path: str, noindex: bool) -> None:
    for path in OUTPUT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".html":
            text = add_favicon(text)
            text = add_clock(text)
            text = add_analytics(text)
            relative = path.relative_to(OUTPUT).as_posix()
            if noindex or relative.startswith("content/templates/") or relative in {"404.html", "blog/style-guide/index.html"}:
                text = add_noindex(text)
        text = rewrite_root_paths(text, base_path, path.suffix.lower())
        path.write_text(text, encoding="utf-8", newline="\n")
    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")


def validate_discovery() -> int:
    """Check sitemap URLs against actual indexable canonical HTML, not a fixed count."""
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = [node.text or "" for node in ET.parse(OUTPUT / "sitemap.xml").findall("s:url/s:loc", namespace)]
    if len(locations) != len(set(locations)):
        raise RuntimeError("Duplicate sitemap URLs")
    for location in locations:
        url = urllib.parse.urlsplit(location)
        if url.scheme != "https" or url.netloc != "www.pavelzosim.com" or url.query or url.fragment or not url.path.endswith("/"):
            raise RuntimeError(f"Noncanonical sitemap URL: {location}")
        route = OUTPUT / url.path.lstrip("/") / "index.html"
        document = route.read_text(encoding="utf-8")
        canonical = re.findall(r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', document, re.I)
        if canonical != [location] or re.search(r'<meta\b[^>]*\bnoindex\b', document, re.I):
            raise RuntimeError(f"Sitemap/canonical/indexing mismatch: {location}")
    return len(locations)


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
        validate_discovery()
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
    prepare_static_loading(records)
    reuse_identical_media()
    transform_site(base_path, args.noindex)
    write_discovery_files(records, args.noindex)
    validate_site(base_path, args.noindex)
    print(f"Built {OUTPUT} with base path {base_path or '/'}; noindex={args.noindex}")


if __name__ == "__main__":
    main()
