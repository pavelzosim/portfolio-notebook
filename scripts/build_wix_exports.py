#!/usr/bin/env python3
"""Render authorized Wix Blog exports as canonical static Atlas articles."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
EXPORTS = ROOT / "content" / "migration" / "wix-export"
POSTS = ROOT / "content" / "posts" / "atlas-html"
REGISTRY = ROOT / "content" / "posts" / "index.json"
DOMAIN = "https://www.pavelzosim.com"


def esc(value: object, quote: bool = False) -> str:
    return html.escape(str(value or ""), quote=quote)


def media_url(source: object) -> str:
    if not isinstance(source, dict):
        return ""
    value = source.get("url") or source.get("id") or ""
    if value and not value.startswith(("http://", "https://", "/")):
        value = "https://static.wixstatic.com/media/" + value
    return value


def text_content(node: dict) -> str:
    if node.get("type") == "TEXT":
        return str(node.get("textData", {}).get("text", ""))
    return "".join(text_content(child) for child in node.get("nodes", []))


def render_text(node: dict) -> str:
    data = node.get("textData", {})
    output = esc(data.get("text", ""))
    for decoration in data.get("decorations", []):
        kind = decoration.get("type")
        if kind == "BOLD":
            output = f"<strong>{output}</strong>"
        elif kind == "ITALIC":
            output = f"<em>{output}</em>"
        elif kind == "UNDERLINE":
            output = f"<u>{output}</u>"
        elif kind == "LINK":
            link = decoration.get("linkData", {}).get("link", {})
            url = esc(link.get("url", ""), quote=True)
            target = ' target="_blank" rel="noopener noreferrer"' if link.get("target") == "BLANK" else ""
            output = f'<a href="{url}"{target}>{output}</a>'
    return output


def youtube_id(url: str) -> str:
    parsed = urlparse(url)
    if parsed.hostname in {"youtu.be", "www.youtu.be"}:
        return parsed.path.strip("/").split("/")[0]
    if parsed.hostname and "youtube.com" in parsed.hostname:
        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/", 1)[1].split("/", 1)[0]
        return parse_qs(parsed.query).get("v", [""])[0]
    return ""


def render_node(node: dict, table_header: bool = False) -> str:
    kind = node.get("type", "")
    children = node.get("nodes", [])
    inner = "".join(render_node(child) for child in children)

    if kind == "TEXT":
        return render_text(node)
    if kind == "PARAGRAPH":
        return f"<p>{inner or '&nbsp;'}</p>"
    if kind == "HEADING":
        level = max(2, min(6, int(node.get("headingData", {}).get("level", 2))))
        return f"<h{level}>{inner}</h{level}>"
    if kind == "BULLETED_LIST":
        return f"<ul>{inner}</ul>"
    if kind == "ORDERED_LIST":
        return f"<ol>{inner}</ol>"
    if kind == "LIST_ITEM":
        item = inner
        if item.startswith("<p>") and item.endswith("</p>") and item.count("<p>") == 1:
            item = item[3:-4]
        return f"<li>{item}</li>"
    if kind == "BLOCKQUOTE":
        return f"<blockquote>{inner}</blockquote>"
    if kind == "DIVIDER":
        return "<hr>"
    if kind == "CODE_BLOCK":
        return f"<pre><code>{esc(text_content(node))}</code></pre>"
    if kind == "IMAGE":
        data = node.get("imageData", {})
        image = data.get("image", {})
        src = media_url(image.get("src", {}))
        alt = data.get("altText") or data.get("caption") or "Technical article illustration"
        caption = data.get("caption") or "".join(text_content(child) for child in children if child.get("type") == "CAPTION")
        label = f'<div class="media-caption">{esc(caption)}</div>' if caption else ""
        return f'<div class="media-frame"><img src="{esc(src, True)}" alt="{esc(alt, True)}" loading="lazy">{label}</div>' if src else ""
    if kind == "GALLERY":
        images = []
        for item in node.get("galleryData", {}).get("items", []):
            image = item.get("image", {}).get("media", {})
            src = media_url(image.get("src", {}))
            if src:
                images.append(f'<img src="{esc(src, True)}" alt="{esc(item.get("altText") or "Technical gallery image", True)}" loading="lazy">')
        return f'<div class="media-frame"><div class="gallery-grid">{"".join(images)}</div></div>' if images else ""
    if kind == "VIDEO":
        data = node.get("videoData", {})
        url = media_url(data.get("video", {}).get("src", {}))
        title = data.get("title") or "Video"
        video = youtube_id(url)
        if video:
            return f'<div class="media-frame"><iframe src="https://www.youtube.com/embed/{esc(video, True)}" title="{esc(title, True)}" loading="lazy" allowfullscreen></iframe><div class="media-caption">{esc(title)}</div></div>'
        return f'<div class="media-frame"><video controls preload="metadata" src="{esc(url, True)}"></video><div class="media-caption">{esc(title)}</div></div>' if url else ""
    if kind == "HTML":
        raw = node.get("htmlData", {}).get("html", "")
        raw = re.sub(r"<script\b[^>]*>.*?</script>", "", raw, flags=re.I | re.S)
        return f'<div class="atlas-embed">{raw}</div>'
    if kind == "TABLE":
        rows = []
        for row_index, row in enumerate(children):
            cells = []
            for cell in row.get("nodes", []):
                tag = "th" if row_index == 0 and node.get("tableData", {}).get("rowHeader") else "td"
                cell_html = "".join(render_node(child) for child in cell.get("nodes", []))
                cells.append(f"<{tag}>{cell_html}</{tag}>")
            rows.append("<tr>" + "".join(cells) + "</tr>")
        return '<div class="atlas-table-frame"><table>' + "".join(rows) + "</table></div>"
    if kind == "BUTTON":
        data = node.get("buttonData", {})
        link = data.get("link", {})
        return f'<p><a class="atlas-btn" href="{esc(link.get("url"), True)}" target="_blank" rel="noopener noreferrer">{esc(data.get("text") or "Open")}</a></p>'
    if kind in {"CAPTION", "TABLE_ROW", "TABLE_CELL"}:
        return inner
    return inner


def seo_value(post: dict, selector: str) -> str:
    for tag in post.get("seoData", {}).get("tags", []):
        props = tag.get("props", {})
        if selector == "title" and tag.get("type") == "title" and tag.get("children"):
            return str(tag["children"]).strip()
        if props.get("name") == selector or props.get("property") == selector:
            if props.get("content"):
                return str(props["content"]).strip()
    return ""


def representative_image(post: dict) -> str:
    wix_image = post.get("media", {}).get("wixMedia", {}).get("image", {})
    if wix_image.get("url"):
        return wix_image["url"]
    og = seo_value(post, "og:image")
    if og:
        return og
    stack = list(post.get("richContent", {}).get("nodes", []))
    while stack:
        node = stack.pop(0)
        if node.get("type") == "IMAGE":
            return media_url(node.get("imageData", {}).get("image", {}).get("src", {}))
        if node.get("type") == "GALLERY":
            items = node.get("galleryData", {}).get("items", [])
            if items:
                return media_url(items[0].get("image", {}).get("media", {}).get("src", {}))
        stack[0:0] = node.get("nodes", [])
    return ""


def article_html(post: dict, tags: list[str]) -> str:
    slug = post["slug"]
    canonical = f"{DOMAIN}/post/{slug}"
    description = seo_value(post, "description") or post.get("excerpt", "")
    description = re.sub(r"\s+", " ", description).strip()[:300]
    title = post["title"].strip()
    seo_title = seo_value(post, "title") or f"{title} · Pavel Zosim"
    image = representative_image(post)
    published = str(post.get("firstPublishedDate", ""))[:10]
    modified = str(post.get("lastPublishedDate", ""))[:10] or published
    body = "\n".join(render_node(node) for node in post.get("richContent", {}).get("nodes", []))
    image_tags = ""
    if image:
        image_tags = f'<meta property="og:image" content="{esc(image, True)}"><meta name="twitter:image" content="{esc(image, True)}">'
    json_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "url": canonical,
        "mainEntityOfPage": canonical,
        "image": image or None,
        "datePublished": published,
        "dateModified": modified,
        "author": {"@type": "Person", "name": "Pavel Zosim", "url": DOMAIN + "/"},
    }, ensure_ascii=False).replace("</", "<\\/")
    meta_tags = "".join(f"<span>#{esc(tag.lower().replace(' ', '-'))}</span>" for tag in tags[:8])
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{esc(seo_title)}</title>
  <meta name="description" content="{esc(description, True)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article"><meta property="og:title" content="{esc(title, True)}"><meta property="og:description" content="{esc(description, True)}"><meta property="og:url" content="{canonical}">{image_tags}
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title, True)}"><meta name="twitter:description" content="{esc(description, True)}">
  <script type="application/ld+json">{json_ld}</script>
  <link rel="stylesheet" href="/styles/atlas.css?v=55"><link rel="stylesheet" href="/styles/posts.css?v=18">
</head>
<body class="migrated-post" id="top">
  <header class="article-shellbar"><a class="article-shellbar__id" href="/"><b>pavelzosim:</b><span>~/atlas_</span></a><nav aria-label="Primary"><a href="/projects/">Projects</a><span class="article-shellbar__divider">/</span><a href="/#notes">Notes</a><span class="article-shellbar__divider">/</span><a href="/tools/">Tools</a><span class="article-shellbar__divider">/</span><a href="/blog/" aria-current="page">Blog</a><span class="article-shellbar__divider">/</span><a href="/#about">About</a><span class="article-shellbar__divider">/</span><a href="/#contacts">Contacts</a></nav><a class="article-shellbar__status" href="/#contacts"><span>●</span>SYS.ONLINE / UTC+3</a></header>
  <main class="post-shell">
    <header class="post-header"><p class="post-path">~/blog/{esc(slug)}.md</p><h1>{esc(title)}</h1><p class="post-summary">{esc(description)}</p><div class="post-meta"><span>Pavel Zosim</span><span>{published}</span>{meta_tags}</div></header>
    <article class="atlas-container"><div class="content-block">{body}</div></article>
    <footer class="post-end"><a href="/blog/">← Blog index</a><span>Wix archive / UTF-8</span><a href="#top">return 0; ↑</a></footer>
  </main>
  <script src="/scripts/article-page.js?v=14"></script>
</body>
</html>
'''


def main() -> int:
    taxonomy = json.loads((EXPORTS / "taxonomy.json").read_text(encoding="utf-8"))
    tag_names = {item["id"]: item["label"] for item in taxonomy.get("tags", [])}
    category_names = {item["id"]: item.get("label") or item.get("slug") for item in taxonomy.get("categories", [])}
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    records = registry["records"]
    by_url = {record.get("sourceUrl"): record for record in records if record.get("sourceUrl")}
    added = 0
    for path in sorted(EXPORTS.glob("*.json")):
        if path.name == "taxonomy.json":
            continue
        post = json.loads(path.read_text(encoding="utf-8"))
        tags = [tag_names[item] for item in post.get("tagIds", []) if item in tag_names]
        categories = [category_names[item] for item in post.get("categoryIds", []) if item in category_names]
        output = POSTS / f"{post['slug']}.html"
        output.write_text(article_html(post, tags), encoding="utf-8", newline="\n")
        public_url = f"{DOMAIN}/post/{post['slug']}"
        record = by_url.get(public_url)
        if record is None:
            record = {"id": f"WIX-{post['id'][:8].upper()}"}
            records.append(record)
            by_url[public_url] = record
            added += 1
        record.update({
            "title": post["title"].strip(),
            "slug": post["slug"],
            "kind": "article",
            "group": (categories[0] if categories else "archive").lower().replace(" ", "-"),
            "summary": re.sub(r"\s+", " ", seo_value(post, "description") or post.get("excerpt", "")).strip()[:300],
            "tags": tags[:12],
            "image": representative_image(post),
            "imageAlt": post["title"].strip(),
            "localPath": f"/content/posts/atlas-html/{post['slug']}.html",
            "sourceUrl": public_url,
            "publicUrl": public_url,
            "datePublished": str(post.get("firstPublishedDate", ""))[:10],
            "dateModified": str(post.get("lastPublishedDate", ""))[:10],
            "state": "published",
            "indexable": True,
        })
    REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"Rendered {len(list(EXPORTS.glob('*.json'))) - 1} Wix exports; added {added} registry records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
