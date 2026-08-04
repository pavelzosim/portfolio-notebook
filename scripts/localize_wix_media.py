"""Localize portfolio-owned Wix media referenced by the homepage and Atlas posts."""

from __future__ import annotations

import hashlib
import html
import json
import mimetypes
import re
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
POSTS = REPO / "content" / "posts" / "atlas-html"
MEDIA_ROOT = REPO / "public" / "media"
MANIFEST = REPO / "content" / "migration" / "media-map.json"
ALLOWED_HOSTS = {
    "static.wixstatic.com",
    "video.wixstatic.com",
    "images.wixstatic.com",
    "i.ytimg.com",
}
URL_RE = re.compile(r"https?://[^\"'<>\s)]+")
SAFE_EXTENSIONS = {
    ".avif",
    ".gif",
    ".jpeg",
    ".jpg",
    ".mp4",
    ".png",
    ".svg",
    ".webm",
    ".webp",
}


def sources() -> list[tuple[Path, str, str]]:
    items = [(REPO / "index.html", "home", "home")]
    items.extend((path, "posts", path.stem) for path in sorted(POSTS.glob("*.html")))
    return items


def extension_for(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    ext = Path(path).suffix.lower()
    return ext if ext in SAFE_EXTENSIONS else ".bin"


def download(url: str, destination: Path) -> tuple[int, str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 AtlasMigration/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
        content_type = response.headers.get_content_type()

    if destination.suffix == ".bin":
        guessed = mimetypes.guess_extension(content_type) or ".bin"
        destination = destination.with_suffix(guessed)

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return len(data), hashlib.sha256(data).hexdigest(), destination.name


def main() -> int:
    previous_assets: list[dict[str, object]] = []
    if MANIFEST.exists():
        previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
        previous_assets = previous.get("assets", [])

    assets_by_source = {
        (str(asset["document"]), str(asset["sourceUrl"])): asset
        for asset in previous_assets
        if isinstance(asset, dict) and "document" in asset and "sourceUrl" in asset
    }
    errors: list[dict[str, str]] = []

    for source_path, media_group, slug in sources():
        document = source_path.read_text(encoding="utf-8")
        replacements: dict[str, str] = {}

        for raw_url in dict.fromkeys(URL_RE.findall(document)):
            clean_raw = raw_url.rstrip(".,;")
            url = html.unescape(clean_raw)
            parsed = urllib.parse.urlparse(url)
            if parsed.hostname not in ALLOWED_HOSTS:
                continue

            digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
            destination = MEDIA_ROOT / media_group / slug / f"asset-{digest}{extension_for(url)}"
            local_url = f"/public/media/{media_group}/{slug}/{destination.name}"

            try:
                if destination.exists():
                    data = destination.read_bytes()
                    byte_count = len(data)
                    checksum = hashlib.sha256(data).hexdigest()
                    final_name = destination.name
                else:
                    byte_count, checksum, final_name = download(url, destination)
                    if final_name != destination.name:
                        destination = destination.with_name(final_name)
                        local_url = f"/public/media/{media_group}/{slug}/{final_name}"

                replacements[clean_raw] = local_url
                asset = {
                    "document": source_path.relative_to(REPO).as_posix(),
                    "sourceUrl": url,
                    "localUrl": local_url,
                    "bytes": byte_count,
                    "sha256": checksum,
                }
                assets_by_source[(str(asset["document"]), str(asset["sourceUrl"]))] = asset
            except Exception as exc:  # keep the remote URL when localization fails
                errors.append({"document": source_path.relative_to(REPO).as_posix(), "sourceUrl": url, "error": str(exc)})

        for remote, local in replacements.items():
            document = document.replace(remote, local)
        source_path.write_text(document, encoding="utf-8", newline="\n")

    assets = sorted(
        assets_by_source.values(),
        key=lambda asset: (str(asset["document"]), str(asset["sourceUrl"])),
    )
    payload = {
        "generated": date.today().isoformat(),
        "policy": "Wix-owned media and YouTube thumbnails are local. Interactive YouTube embeds and external references remain remote.",
        "assets": assets,
        "errors": errors,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

    total_bytes = sum(int(asset["bytes"]) for asset in assets)
    print(f"Localized {len(assets)} references ({total_bytes / 1024 / 1024:.2f} MiB); errors: {len(errors)}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
