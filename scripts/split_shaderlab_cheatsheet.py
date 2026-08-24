from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "posts" / "atlas-html"
SOURCE = POSTS / "unity-shaderlab-cheatsheet.html"
ARCHIVE = ROOT / "content" / "migration" / "unity-shaderlab-cheatsheet-monolith.source.txt"
REGISTRY = ROOT / "content" / "posts" / "index.json"
DOMAIN = "https://www.pavelzosim.com"
IMAGE = "/public/media/posts/unity-shaderlab-cheatsheet/asset-0ffadac9d2348774.png"


PARTS = [
    {
        "id": "REF-001",
        "slug": "unity-shaderlab-cheatsheet",
        "title": "Unity ShaderLab Cheatsheet — Fundamentals & Properties",
        "short": "01 Fundamentals & Properties",
        "description": "ShaderLab fundamentals: file anatomy, CG and HLSL execution, shader identity, Properties syntax, data types, and Inspector drawers.",
        "start": None,
        "end": "<h2>4. SubShader Setup in ShaderLab</h2>",
    },
    {
        "id": "REF-002",
        "slug": "unity-shaderlab-cheatsheet-render-states",
        "title": "Unity ShaderLab Cheatsheet — Tags & Render States",
        "short": "02 Tags & Render States",
        "description": "A practical ShaderLab reference for SubShader tags, render queues, blending, AlphaToMask, and ColorMask across Unity pipelines.",
        "start": "<h2>4. SubShader Setup in ShaderLab</h2>",
        "end": "<h2>4.5 ShaderLab Culling and Depth Testing</h2>",
    },
    {
        "id": "REF-003",
        "slug": "unity-shaderlab-cheatsheet-depth-stencil-passes",
        "title": "Unity ShaderLab Cheatsheet — Depth, Stencil & Passes",
        "short": "03 Depth, Stencil & Passes",
        "description": "ShaderLab depth and visibility controls: Cull, ZWrite, ZTest, stencil masking, render order, and multi-pass rendering.",
        "start": "<h2>4.5 ShaderLab Culling and Depth Testing</h2>",
        "end": "<h2>5. CGPROGRAM Section</h2>",
    },
    {
        "id": "REF-004",
        "slug": "unity-shaderlab-cheatsheet-hlsl-pipelines-optimization",
        "title": "Unity ShaderLab Cheatsheet — HLSL, Pipelines & Optimization",
        "short": "04 HLSL, Pipelines & Optimization",
        "description": "Unity shader program architecture: HLSL stages, semantics, precision, intrinsic functions, render pipelines, optimization, and adaptation.",
        "start": "<h2>5. CGPROGRAM Section</h2>",
        "end": None,
    },
]


def strip_markup(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def clean_heading(value: str) -> str:
    text = strip_markup(value)
    text = re.sub(r"^\d+(?:\.\d+)*\.?\s*", "", text)
    return text.strip(" —–-")


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "section"


def normalize_fragment(fragment: str) -> tuple[str, list[tuple[str, str]]]:
    fragment = re.sub(r"\s*<!---?\s*H2 SECTION (?:START|END)\s*-?-->\s*", "\n", fragment)
    fragment = fragment.replace('data-lang="', 'data-language="')
    fragment = fragment.replace('class="atlas-data-table"', 'class="atlas-table"')
    fragment = fragment.replace('class="atlas-table-responsive"', 'class="atlas-table-frame atlas-table-frame--solid"')
    fragment = fragment.replace('class="atlas-media-container"', 'class="media-frame"')
    fragment = fragment.replace('class="atlas-media-caption"', 'class="media-caption"')
    fragment = fragment.replace('class="atlas-media-node"', 'class="media-frame"')
    fragment = fragment.replace('class="atlas-media-node__wrapper"', 'class="atlas-media-node__wrapper"')
    fragment = fragment.replace('class="atlas-media-node__caption"', 'class="media-caption"')

    toc: list[tuple[str, str]] = []
    used_ids: set[str] = set()
    h2_index = 0

    def replace_heading(match: re.Match[str]) -> str:
        nonlocal h2_index
        level = match.group(1)
        title = clean_heading(match.group(2))
        base_id = slugify(title)
        heading_id = base_id
        suffix = 2
        while heading_id in used_ids:
            heading_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(heading_id)
        if level == "2":
            h2_index += 1
            title = f"{h2_index:02d} {title}"
            toc.append((heading_id, title))
        return f'<h{level} id="{heading_id}">{html.escape(title)}</h{level}>'

    fragment = re.sub(r"<h([23])(?:\s+[^>]*)?>(.*?)</h\1>", replace_heading, fragment, flags=re.S | re.I)
    fragment = re.sub(r"<hr(?:\s+[^>]*)?>", '<div class="atlas-section-break" data-index="// SECTION"></div>', fragment, flags=re.I)
    return fragment.strip(), toc


def toc_markup(items: list[tuple[str, str]]) -> str:
    rows = []
    for index, (heading_id, title) in enumerate(items, 1):
        label = re.sub(r"^\d+\s+", "", title)
        rows.append(
            f'          <li class="atlas-toc__item atlas-toc__item--h2"><a href="#{heading_id}">'
            f'<span class="atlas-toc__num">{index:02d}</span><span class="atlas-toc__row">'
            f'<span class="atlas-toc__title">{html.escape(label)}</span><span class="atlas-toc__dots"></span>'
            f'</span></a></li>'
        )
    return "\n".join(rows)


def series_markup(active_slug: str) -> str:
    links = []
    for part in PARTS:
        current = ' aria-current="page"' if part["slug"] == active_slug else ""
        links.append(f'        <a href="/post/{part["slug"]}/"{current}>{html.escape(part["short"])}</a>')
    return "\n".join(links)


def render_page(part: dict[str, str | None], fragment: str, toc: list[tuple[str, str]]) -> str:
    title = str(part["title"])
    description = str(part["description"])
    slug = str(part["slug"])
    canonical = f"{DOMAIN}/post/{slug}"
    structured = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": title,
        "description": description,
        "url": canonical,
        "mainEntityOfPage": canonical,
        "image": f"{DOMAIN}{IMAGE}",
        "dateModified": "2026-08-24",
        "author": {"@type": "Person", "name": "Pavel Zosim", "url": f"{DOMAIN}/"},
        "isPartOf": {"@type": "CreativeWorkSeries", "name": "Unity ShaderLab Cheatsheet"},
    }
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{html.escape(title)} · Pavel Zosim</title>
  <meta name="description" content="{html.escape(description, quote=True)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html.escape(title, quote=True)}">
  <meta property="og:description" content="{html.escape(description, quote=True)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{DOMAIN}{IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(title, quote=True)}">
  <meta name="twitter:description" content="{html.escape(description, quote=True)}">
  <meta name="twitter:image" content="{DOMAIN}{IMAGE}">
  <script type="application/ld+json">{json.dumps(structured, ensure_ascii=False, separators=(",", ":"))}</script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
  <link rel="stylesheet" href="/styles/atlas.css?v=55">
  <link rel="stylesheet" href="/styles/posts.css?v=18">
</head>
<body id="top">
  <h1 class="seo-heading">{html.escape(title)}</h1>
  <header class="article-shellbar"><a class="article-shellbar__id" href="/"><b>pavelzosim:</b><span>~/atlas_</span></a><nav aria-label="Primary"><a href="/projects/">Projects</a><span class="article-shellbar__divider">/</span><a href="/#notes">Notes</a><span class="article-shellbar__divider">/</span><a href="/tools/">Tools</a><span class="article-shellbar__divider">/</span><a href="/blog/" aria-current="page">Blog</a><span class="article-shellbar__divider">/</span><a href="/#about">About</a><span class="article-shellbar__divider">/</span><a href="/#contacts">Contacts</a></nav><a class="article-shellbar__status" href="/#contacts"><span>●</span>SYS.ONLINE / UTC+3</a></header>

  <div class="atlas-container">
    <div id="site-passport"></div>
    <div class="content-block">
      <nav class="atlas-series-nav" aria-label="Unity ShaderLab Cheatsheet series">
        <span>[ SERIES // UNITY_SHADERLAB ]</span>
{series_markup(slug)}
      </nav>

      <nav class="atlas-toc" aria-label="Article table of contents">
        <ul class="atlas-toc__list">
{toc_markup(toc)}
        </ul>
      </nav>

{fragment}

      <div class="atlas-eof-divider"><span class="atlas-eof-divider__line"></span><span class="atlas-eof-divider__meta">// END OF PART // UNITY_SHADERLAB // EOF</span><span class="atlas-eof-divider__line"></span></div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-clike.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-glsl.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-hlsl.min.js"></script>
  <script src="/scripts/article-page.js?v=14"></script>
</body>
</html>
'''


def split_source() -> None:
    if not ARCHIVE.exists():
        ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SOURCE, ARCHIVE)
    source = ARCHIVE.read_text(encoding="utf-8")
    content_start = source.index('<div class="content-block">') + len('<div class="content-block">')
    content_end = source.index('<div class="atlas-eof-divider">', content_start)
    content = source[content_start:content_end]

    for part in PARTS:
        start_marker = part["start"]
        end_marker = part["end"]
        start = content.index(str(start_marker)) if start_marker else 0
        end = content.index(str(end_marker), start) if end_marker else len(content)
        fragment, toc = normalize_fragment(content[start:end])
        target = POSTS / f'{part["slug"]}.html'
        target.write_text(render_page(part, fragment, toc), encoding="utf-8", newline="\n")


def update_registry() -> None:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    records = registry["records"]
    series_slugs = {str(part["slug"]) for part in PARTS}
    position = next(i for i, record in enumerate(records) if record.get("slug") in series_slugs)
    template = records[position]
    records[:] = [record for record in records if record.get("slug") not in series_slugs]
    replacements = []
    for part in PARTS:
        replacements.append({
            "id": part["id"],
            "title": part["title"],
            "kind": "reference",
            "group": "shaders",
            "summary": part["description"],
            "tags": ["unity", "shaderlab", "shaders"],
            "image": IMAGE,
            "localPath": f'/content/posts/atlas-html/{part["slug"]}.html',
            "state": "published",
            "sourceUrl": template.get("sourceUrl", f'{DOMAIN}/post/{part["slug"]}') if part["id"] == "REF-001" else f'{DOMAIN}/post/{part["slug"]}',
            "publicUrl": f'{DOMAIN}/post/{part["slug"]}',
            "slug": part["slug"],
            "imageAlt": part["title"],
            "datePublished": template.get("datePublished", ""),
            "dateModified": "2026-08-24",
            "indexable": True,
        })
    records[position:position] = replacements
    REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    split_source()
    update_registry()
    print("Split Unity ShaderLab Cheatsheet into four canonical articles.")
