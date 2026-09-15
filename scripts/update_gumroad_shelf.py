#!/usr/bin/env python3
"""Refresh price/sold-count for the homepage Gumroad carousel.

Scrapes each product's own public Gumroad page (no API key involved) for the
current price and sales count, then rewrites the slide markup in index.html
and reorders slides by popularity. Run manually whenever you want fresh
numbers, then rebuild the site as usual:

    python scripts/update_gumroad_shelf.py
    python scripts/build_github_pages.py
    python scripts/audit_site.py
"""

from __future__ import annotations

import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
USER_AGENT = "Mozilla/5.0 (compatible; pavelzosim-site-shelf-refresh/1.0)"

SLIDE_RE = re.compile(
    r'<a class="gumroad-shelf__slide"( hidden)? href="(https://pavelzosim\.gumroad\.com/l/[^"]+)"'
    r'[^>]*>(.*?)</a>'
)
PRICE_RE = re.compile(r'product:price:amount"\s+content="([\d.]+)"')
# Matches the product's own "price_cents" key, not lookalikes such as
# "buyer_local_price_cents" (a locale-dependent currency conversion that
# varies with the requester's IP) or "rental_price_cents".
SUGGESTED_PRICE_CENTS_RE = re.compile(r"(?<![A-Za-z0-9_])suggested_price_cents&quot;:(\d+)")
SALES_RE = re.compile(r"sales_count&quot;:(\d+)")


def fetch_product(url: str) -> tuple[str | None, int | None]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        html = response.read().decode("utf-8", errors="replace")

    label = None
    price_match = PRICE_RE.search(html)
    if price_match:
        price = float(price_match.group(1))
        has_suggested_price = bool(SUGGESTED_PRICE_CENTS_RE.search(html))
        label = f"€{price:g}" + ("+" if has_suggested_price else "")

    # Gumroad only publishes sales_count when the seller has "show sales
    # count" enabled for that product; it's null (no digits) otherwise.
    sales_match = SALES_RE.search(html)
    sold = int(sales_match.group(1)) if sales_match else None

    return label, sold


def main() -> None:
    document = INDEX.read_text(encoding="utf-8")
    matches = list(SLIDE_RE.finditer(document))
    if not matches:
        raise RuntimeError("No Gumroad shelf slides found in index.html")

    slides = []
    for match in matches:
        _, url, inner = match.groups()
        print(f"Fetching {url} ...")
        label, sold = fetch_product(url)
        old_price_match = re.search(r"<b>([^<]*)</b>", inner)
        old_sold_match = re.search(r"<i>(\d+) sold</i>", inner)
        old_label = old_price_match.group(1) if old_price_match else "?"
        old_sold = int(old_sold_match.group(1)) if old_sold_match else 0

        if label is None:
            print(f"  WARNING: no price found, keeping {old_label!r}")
            label = old_label
        if sold is None:
            print(f"  WARNING: sales count isn't public on this product page, keeping {old_sold} sold")
            sold = old_sold

        if label != old_label or sold != old_sold:
            print(f"  {old_label} / {old_sold} sold  ->  {label} / {sold} sold")
        else:
            print(f"  unchanged ({label} / {sold} sold)")

        new_inner = re.sub(r"<b>[^<]*</b>", f"<b>{label}</b>", inner, count=1)
        new_inner = re.sub(r"<i>\d+ sold</i>", f"<i>{sold} sold</i>", new_inner, count=1)
        slides.append((url, sold, new_inner))
        time.sleep(1)

    slides.sort(key=lambda item: item[1], reverse=True)

    lines = []
    for index, (url, sold, inner) in enumerate(slides):
        hidden = "" if index == 0 else " hidden"
        lines.append(
            f'          <a class="gumroad-shelf__slide"{hidden} href="{url}" '
            f'target="_blank" rel="noopener noreferrer">{inner}</a>'
        )
    new_block = "\n".join(lines)

    start = matches[0].start()
    end = matches[-1].end()
    line_start = document.rfind("\n", 0, start) + 1
    line_end = document.find("\n", end)
    document = document[:line_start] + new_block + document[line_end:]
    INDEX.write_text(document, encoding="utf-8", newline="\n")
    print(f"Updated {len(slides)} slides in {INDEX.relative_to(ROOT)}, ordered by sales.")


if __name__ == "__main__":
    main()
