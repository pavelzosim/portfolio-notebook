#!/usr/bin/env python3
"""Add canonical and social metadata to public non-post pages."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://www.pavelzosim.com"
PAGES = {
    "index.html": ("/", "Pavel Zosim / Technical Systems Notebook", "Pavel Zosim — Technical Artist working across Unity, Unreal, procedural systems, shaders, hardware-aware R&D, and production tools.", "WebSite"),
    "blog/index.html": ("/blog/", "Blog index / Pavel Zosim", "Technical notes, R&D logs, breakdowns, and lessons by Pavel Zosim.", "CollectionPage"),
    "projects/index.html": ("/projects/", "Projects / Pavel Zosim", "Selected technical-art production records by Pavel Zosim.", "CollectionPage"),
    "tools/index.html": ("/tools/", "Tools and assets / Pavel Zosim", "Production tools, scripts, Houdini systems, and real-time assets by Pavel Zosim.", "CollectionPage"),
    "privacy/index.html": ("/privacy/", "Privacy and analytics / Pavel Zosim", "Privacy and Google Analytics information for Pavel Zosim's technical portfolio and R&D notebook.", "WebPage"),
    "projects/nasa-first-woman/index.html": ("/projects/nasa-first-woman", "NASA First Woman / Pavel Zosim", "NASA First Woman XR technical-art project record by Pavel Zosim.", "CreativeWork"),
}


def main() -> int:
    for relative, (route, title, description, schema_type) in PAGES.items():
        path = ROOT / relative
        text = path.read_text(encoding="utf-8")
        canonical = DOMAIN + route
        text = re.sub(r'<link\b[^>]*rel=["\']canonical["\'][^>]*>', "", text, flags=re.I)
        text = re.sub(r'<meta\b[^>]*property=["\']og:[^"\']+["\'][^>]*>', "", text, flags=re.I)
        text = re.sub(r'<meta\b[^>]*name=["\']twitter:[^"\']+["\'][^>]*>', "", text, flags=re.I)
        text = re.sub(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>', "", text, flags=re.I | re.S)
        structured = json.dumps({
            "@context": "https://schema.org", "@type": schema_type, "name": title,
            "description": description, "url": canonical,
            "author": {"@type": "Person", "name": "Pavel Zosim", "url": DOMAIN + "/"},
        }, ensure_ascii=False).replace("</", "<\\/")
        meta = (
            f'<link rel="canonical" href="{canonical}"><meta property="og:type" content="website">'
            f'<meta property="og:title" content="{html.escape(title, quote=True)}">'
            f'<meta property="og:description" content="{html.escape(description, quote=True)}">'
            f'<meta property="og:url" content="{canonical}"><meta name="twitter:card" content="summary">'
            f'<script type="application/ld+json">{structured}</script>'
        )
        text = re.sub(r"(</title>)", r"\1" + meta, text, count=1, flags=re.I)
        text = "\n".join(line.rstrip() for line in text.rstrip().splitlines()) + "\n"
        path.write_text(text, encoding="utf-8", newline="\n")
    print(f"Normalized {len(PAGES)} public site pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
