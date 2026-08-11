#!/usr/bin/env python3
"""Migrate the remaining public Wix posts into clean local Atlas HTML."""

from __future__ import annotations

import hashlib
import html as html_std
import json
import mimetypes
import re
import copy
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "content" / "posts" / "index.json"
MEDIA_MAP_PATH = ROOT / "content" / "migration" / "media-map.json"
OUTPUT_DIR = ROOT / "content" / "posts" / "atlas-html"
MEDIA_ROOT = ROOT / "public" / "media" / "posts"
USER_AGENT = "Mozilla/5.0 (compatible; PavelZosimContentMigration/1.0)"
BLOCK_TAGS = {"h2", "h3", "h4", "p", "ul", "ol", "pre", "blockquote", "figure", "table", "img", "video"}
MIGRATION_SLUGS = {
    "procedural-interior-design-pipeline-houdini-usd",
    "folder-structure-cli-tool",
    "jackpressed-powerful-image-compression-resizing-tool",
    "low-poly-dumpster-3d-model",
    "modular-market-shelf-3d-model",
    "technical-art-cg-shaders-a-unified-guide-to-shaders",
    "technical-art-compute-shaders-in-unity-introduction",
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def canonical_media_url(url: str) -> str:
    url = html_std.unescape(url or "").strip().strip('"\'')
    if not url:
        return ""
    if "static.wixstatic.com/media/" in url and "/v1/" in url:
        return url.split("/v1/", 1)[0]
    return url


def extension_for(url: str, content_type: str | None = None) -> str:
    suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    guessed = mimetypes.guess_extension((content_type or "").split(";", 1)[0].strip())
    return guessed or ".bin"


def download_asset(url: str, slug: str, media_map: dict) -> str:
    source_url = canonical_media_url(url)
    existing = next((item for item in media_map["assets"] if item.get("sourceUrl") == source_url), None)
    if existing:
        return existing["localUrl"]

    request = urllib.request.Request(source_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = response.read()
        content_type = response.headers.get("Content-Type")

    digest = hashlib.sha256(payload).hexdigest()
    suffix = extension_for(source_url, content_type)
    filename = f"asset-{digest[:16]}{suffix}"
    output_dir = MEDIA_ROOT / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    output_path.write_bytes(payload)
    local_url = f"/public/media/posts/{slug}/{filename}"
    media_map["assets"].append(
        {
            "document": f"content/posts/atlas-html/{slug}.html",
            "sourceUrl": source_url,
            "localUrl": local_url,
            "bytes": len(payload),
            "sha256": digest,
        }
    )
    return local_url


def inline_html(element) -> str:
    def render(node) -> str:
        parts = [html_std.escape(node.text or "")]
        for child in node:
            tag = child.tag.lower() if isinstance(child.tag, str) else ""
            inner = render(child)
            if tag == "a" and child.get("href"):
                href = html_std.escape(child.get("href"), quote=True)
                inner = f'<a href="{href}" rel="external">{inner}</a>'
            elif tag in {"strong", "b"}:
                inner = f"<strong>{inner}</strong>"
            elif tag in {"em", "i"}:
                inner = f"<em>{inner}</em>"
            elif tag in {"code", "kbd"}:
                inner = f"<code>{inner}</code>"
            elif tag == "br":
                inner = "<br>" + inner
            parts.append(inner)
            parts.append(html_std.escape(child.tail or ""))
        return "".join(parts)

    return normalize_space(render(element))


def image_source(element) -> str:
    candidates = []
    if element.get("src"):
        candidates.append(element.get("src"))
    if element.get("data-src"):
        candidates.append(element.get("data-src"))
    if element.get("srcset"):
        candidates.extend(item.strip().split(" ", 1)[0] for item in element.get("srcset").split(","))
    candidates = [candidate for candidate in candidates if candidate and not candidate.startswith("data:")]
    if not candidates:
        return ""
    return max(candidates, key=lambda value: len(value))


def figure_html(element, slug: str, media_map: dict, emitted: set[str]) -> str:
    style_text = " ".join(element.xpath('.//@style'))
    youtube_ids = re.findall(r"i\.ytimg\.com/vi/([^/]+)/", style_text)
    caption = normalize_space(" ".join(element.xpath('.//figcaption//text()')))
    if youtube_ids:
        video_id = youtube_ids[0]
        label = html_std.escape(caption or "YouTube video")
        return (
            '<div class="media-frame"><iframe '
            f'src="https://www.youtube.com/embed/{html_std.escape(video_id, quote=True)}" '
            'title="' + label + '" loading="lazy" allowfullscreen></iframe>'
            + (f'<div class="media-caption">{label}</div>' if caption else "")
            + "</div>"
        )

    media = []
    nodes = [element] if element.tag.lower() in {"img", "video"} else element.xpath('.//img|.//video')
    for node in nodes:
        raw = node.get("src") if node.tag.lower() == "video" else image_source(node)
        source = canonical_media_url(raw)
        if not source or source in emitted:
            continue
        emitted.add(source)
        try:
            local_url = download_asset(source, slug, media_map)
        except Exception as error:
            media_map["errors"].append({"document": slug, "sourceUrl": source, "error": str(error)})
            continue
        alt = normalize_space(node.get("alt") or caption or slug.replace("-", " "))
        if node.tag.lower() == "video":
            media.append(f'<video controls preload="metadata" src="{local_url}"></video>')
        else:
            media.append(f'<img src="{local_url}" alt="{html_std.escape(alt, quote=True)}" loading="lazy">')
    if not media:
        return ""
    label = f'<div class="media-caption">{html_std.escape(caption)}</div>' if caption else ""
    if len(media) == 1:
        return f'<div class="media-frame">{media[0]}{label}</div>'
    return f'<div class="media-frame"><div class="gallery-grid">{"".join(media)}</div>{label}</div>'


def table_html(element) -> str:
    rows = []
    for row in element.xpath('.//tr'):
        cells = []
        for cell in row.xpath('./th|./td'):
            tag = "th" if cell.tag.lower() == "th" else "td"
            cells.append(f"<{tag}>{html_std.escape(normalize_space(cell.text_content()))}</{tag}>")
        if cells:
            rows.append("<tr>" + "".join(cells) + "</tr>")
    return '<div class="atlas-table-frame"><table>' + "".join(rows) + "</table></div>" if rows else ""


def list_html(element) -> str:
    tag = element.tag.lower()
    items = []
    for item in element.xpath('./li'):
        item_copy = copy.deepcopy(item)
        nested_lists = item_copy.xpath('./ul|./ol')
        for nested in nested_lists:
            nested.getparent().remove(nested)
        label = inline_html(item_copy)
        nested_html = "".join(list_html(nested) for nested in item.xpath('./ul|./ol'))
        if label or nested_html:
            items.append(f"<li>{label}{nested_html}</li>")
    return f"<{tag}>" + "".join(items) + f"</{tag}>" if items else ""


def convert_block(element, slug: str, media_map: dict, emitted: set[str]) -> str:
    tag = element.tag.lower()
    text = normalize_space(element.text_content())
    if tag in {"h2", "h3", "h4"}:
        return f"<{tag}>{html_std.escape(text)}</{tag}>" if text else ""
    if tag == "p":
        return f"<p>{inline_html(element)}</p>" if text else ""
    if tag in {"ul", "ol"}:
        return list_html(element)
    if tag == "pre":
        return f"<pre><code>{html_std.escape(element.text_content().strip())}</code></pre>" if text else ""
    if tag == "blockquote":
        return f"<blockquote>{html_std.escape(text)}</blockquote>" if text else ""
    if tag == "table":
        return table_html(element)
    if tag == "figure":
        return figure_html(element, slug, media_map, emitted)
    if tag in {"img", "video"}:
        return figure_html(element, slug, media_map, emitted)
    return ""


def extract_blocks(section, slug: str, media_map: dict) -> tuple[list[str], str | None]:
    blocks = []
    emitted: set[str] = set()
    first_image = None
    for element in section.iterdescendants():
        if not isinstance(element.tag, str) or element.tag.lower() not in BLOCK_TAGS:
            continue
        ancestors = [
            parent.tag.lower()
            for parent in element.iterancestors()
            if parent is not section and isinstance(parent.tag, str)
        ]
        if element.tag.lower() in {"img", "video"}:
            if "figure" in ancestors:
                continue
        elif any(tag in BLOCK_TAGS for tag in ancestors):
            continue
        text = normalize_space(element.text_content())
        if text.startswith("Like this post?") or text.startswith("Support:"):
            break
        block = convert_block(element, slug, media_map, emitted)
        if block:
            blocks.append(block)
            if first_image is None:
                match = re.search(r'<img src="([^"]+)"', block)
                if match:
                    first_image = match.group(1)
    return blocks, first_image


def build_page(record: dict, title: str, description: str, blocks: list[str], published: str) -> str:
    slug = record["sourceUrl"].rstrip("/").split("/")[-1]
    canonical = record["sourceUrl"]
    escaped_title = html_std.escape(title)
    escaped_description = html_std.escape(description, quote=True)
    tags = "".join(f"<span>#{html_std.escape(tag)}</span>" for tag in record.get("tags", []))
    content = "\n      ".join(blocks)
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="canonical" href="{html_std.escape(canonical, quote=True)}">
  <meta name="description" content="{escaped_description}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html_std.escape(title, quote=True)}">
  <meta property="og:description" content="{escaped_description}">
  <meta property="og:url" content="{html_std.escape(canonical, quote=True)}">
  <title>{escaped_title} · Pavel Zosim</title>
  <link rel="stylesheet" href="/styles/atlas.css">
  <link rel="stylesheet" href="/styles/posts.css">
</head>
<body class="migrated-post">
  <main class="post-shell">
    <header class="post-header">
      <p class="post-path">~/blog/{html_std.escape(slug)}.md</p>
      <h1>{escaped_title}</h1>
      <p class="post-summary">{html_std.escape(description)}</p>
      <div class="post-meta"><span>Pavel Zosim</span><span>{html_std.escape(published or 'archive')}</span>{tags}</div>
    </header>
    <article class="atlas-container">
      <div class="content-block">
      {content}
      </div>
    </article>
    <footer class="post-end"><a href="/blog/">← Blog index</a><span>Local archive / UTF-8</span><a href="#top">return 0; ↑</a></footer>
  </main>
</body>
</html>
'''


def main() -> None:
    index_data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    media_map = json.loads(MEDIA_MAP_PATH.read_text(encoding="utf-8"))
    media_map.setdefault("assets", [])
    media_map.setdefault("errors", [])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    migrated = 0
    for record in index_data["records"]:
        source_url = record.get("sourceUrl")
        if not source_url:
            continue
        slug = source_url.rstrip("/").split("/")[-1]
        if slug not in MIGRATION_SLUGS:
            continue
        document = html.fromstring(fetch(source_url))
        sections = document.xpath('//*[@data-hook="post-description"]')
        if not sections:
            raise RuntimeError(f"No post-description found for {slug}")
        title = normalize_space(document.xpath('string(//meta[@property="og:title"]/@content)')) or record["title"]
        description = normalize_space(document.xpath('string(//meta[@property="og:description"]/@content)')) or record["summary"]
        description = description[:300]
        published = normalize_space(document.xpath('string(//meta[@property="article:published_time"]/@content)'))[:10]
        blocks, first_image = extract_blocks(sections[0], slug, media_map)
        if not blocks:
            raise RuntimeError(f"No content blocks extracted for {slug}")
        output_path = OUTPUT_DIR / f"{slug}.html"
        output_path.write_text(build_page(record, title, description, blocks, published), encoding="utf-8", newline="\n")
        record["localPath"] = f"/content/posts/atlas-html/{slug}.html"
        record["state"] = "LOCAL"
        if first_image and not record.get("image"):
            record["image"] = first_image
        print(f"{slug}: {len(blocks)} blocks -> {output_path.relative_to(ROOT)}")
        migrated += 1

    media_map["generated"] = date.today().isoformat()
    INDEX_PATH.write_text(json.dumps(index_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    MEDIA_MAP_PATH.write_text(json.dumps(media_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Migrated {migrated} posts; media assets: {len(media_map['assets'])}; errors: {len(media_map['errors'])}")


if __name__ == "__main__":
    main()
