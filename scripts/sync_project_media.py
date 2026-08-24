#!/usr/bin/env python3
"""Rebuild project gallery manifests from the localized media folders."""

from __future__ import annotations

import json
import re
import urllib.parse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "content" / "projects" / "index.json"
MEDIA_ROOT = ROOT / "public" / "media" / "projects"
IMAGE_SUFFIXES = {".gif", ".jpg", ".jpeg", ".png", ".webp"}

FEATURED = {
    "nasa-first-woman": {
        "image": "ui/exploration_comicenv.jpg",
        "video": "video-nasa-first-woman-project.mp4",
        "caption": "NASA First Woman — selected XR project footage.",
    },
    "meta-blumhouse-xr-experience": {
        "image": "Blumhouse-Enhanced-Cinema-1.webp",
        "video": "03 - blumhouse_horizontv.mp4",
        "caption": "Meta × Blumhouse Enhanced Cinema — selected XR production footage.",
    },
    "airport-interaction-screen": {
        "image": "FAA_3DAirport_D_arnold.png",
        "video": "17 - wix_faa.mp4",
        "caption": "Airport Operations Interaction Screen — selected installation footage.",
    },
    "deloitte-virtual-factory": {
        "image": "promo/DF_promo1.png",
        "video": "Environments/01 - image_023_[0030-0090].mp4",
        "caption": "Deloitte Virtual Factory — selected AR digital-twin footage.",
    },
    "quantum-fiber-speed-zone": {
        "image": "asset-5525b19ee3974f58.png",
        "video": "asset-f41a81ac69627246.mp4",
        "caption": "Quantum Fiber Speed Zone — selected live installation footage.",
    },
}

FOLDER_LABELS = {
    "bages": "Badges",
    "environments": "Environments",
    "fvx": "VFX",
    "posters": "Posters",
    "promo": "Promo",
    "robot-emotions": "Robot emotions",
    "ui": "UI",
    "world space ui screens": "World-space UI",
}


def web_path(path: Path) -> str:
    return "/" + urllib.parse.quote(path.relative_to(ROOT).as_posix(), safe="/[]")


def humanize(value: str) -> str:
    value = re.sub(r"[_-]+", " ", value).strip()
    value = re.sub(r"\s+", " ", value)
    return value


def caption_for(path: Path, media_directory: Path) -> str:
    relative = path.relative_to(media_directory)
    parents = [FOLDER_LABELS.get(part.lower(), humanize(part)) for part in relative.parts[:-1]]
    label = humanize(relative.stem)
    return " / ".join([*parents, label])


def main() -> None:
    data = json.loads(INDEX.read_text(encoding="utf-8"))
    for project in data.get("projects", []):
        slug = project["slug"]
        directory = MEDIA_ROOT / slug
        config = FEATURED.get(slug)
        if not directory.is_dir() or not config:
            continue

        hero = directory / config["image"]
        video = directory / config["video"]
        if not hero.is_file():
            raise FileNotFoundError(f"Missing featured image for {slug}: {hero}")
        if not video.is_file():
            raise FileNotFoundError(f"Missing featured video for {slug}: {video}")

        images = sorted(
            (path for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES),
            key=lambda path: (path != hero, path.relative_to(directory).as_posix().lower()),
        )
        project["image"] = web_path(hero)
        project["video"] = {
            "src": web_path(video),
            "poster": web_path(hero),
            "caption": config["caption"],
            "featured": True,
        }
        project["media"] = [
            {
                "src": web_path(path),
                "alt": f"{project['title']} — {caption_for(path, directory)}",
                "caption": caption_for(path, directory),
            }
            for path in images
        ]

    INDEX.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
