#!/usr/bin/env python3
"""Localize selected Wix project records and merge their technical content."""

from __future__ import annotations

import hashlib
import json
import mimetypes
import urllib.parse
import urllib.request
from html import escape
from pathlib import Path

from lxml import html


ROOT = Path(__file__).resolve().parents[1]
PROJECT_INDEX = ROOT / "content" / "projects" / "index.json"
MEDIA_MAP = ROOT / "content" / "migration" / "media-map.json"
MEDIA_ROOT = ROOT / "public" / "media" / "projects"
COMMON_MEDIA_IDS = {"ace175_5319ba0c8f574d6d8578f4f001164938f000.jpg"}
USER_AGENT = "Mozilla/5.0 (compatible; PavelZosimProjectMigration/1.0)"


PROJECTS = [
    {
        "id": "PRJ-002",
        "slug": "meta-blumhouse-xr-experience",
        "title": "Meta × Blumhouse — Enhanced Cinema",
        "type": "XR / cinematic real-time VFX",
        "role": "Technical Artist / VFX / XR",
        "environment": "Unity / Meta Quest 3 / streamed XR",
        "status": "PRODUCTION",
        "summary": "XR cinematic experience combining streamed 4K content, spatial audio, and synchronized real-time VFX on standalone Meta Quest hardware.",
        "overview": "The experience reimagined Blumhouse films including M3GAN and The Black Phone as immersive XR cinema. Real-time environmental effects extended beyond the streamed screen while spatial audio increased presence. It premiered at Meta Connect and was later released publicly on the Meta Quest Store.",
        "scope": [
            "XR cinematic experience with minimal interactivity",
            "Real-time streaming application for Meta Quest 3 and Meta Quest 3S",
            "High-quality 4K streamed video with spatial audio",
            "Immersive VFX synchronized with cinematic content",
        ],
        "constraints": [
            "Standalone XR performance budgets",
            "Network latency and bandwidth variability",
            "Strict Meta, Blumhouse, and Universal Pictures IP requirements",
            "Delivery timeline aligned with the Meta Connect premiere",
        ],
        "roleDetails": [
            "Development of real-time shaders and visual effects",
            "Technical-art tools and effect integration",
            "Real-time VFX implementation in Unity",
            "Optimization for Meta Quest hardware",
            "Integration of cinematic content with immersive environmental effects",
        ],
        "solutions": [
            "Developed custom HLSL shaders and XR-specific real-time VFX",
            "Balanced headset rendering budgets with streamed 4K video playback",
            "Layered real-time effects over synchronized cinematic content",
            "Used HISPlayer for streaming and Dolby Atmos for spatial audio",
            "Prototyped cloud-tank simulations and effect workflows in Houdini",
            "Maintained synchronization under changing network conditions",
        ],
        "tools": ["Unity", "HLSL", "Houdini", "HISPlayer", "Dolby Atmos"],
        "results": [
            "Live demonstration at Meta Connect",
            "Public release on the Meta Quest Store",
            "Strong audience response during horror sequences",
            "Positive feedback from Meta and Blumhouse teams",
            "Emmy-nominated immersive production",
            "Reusable techniques for future VR cinema experiences",
        ],
        "outcome": "The project demonstrated that streamed cinematic content, spatial audio, and synchronized real-time effects can form a convincing XR cinema experience within strict standalone-headset constraints.",
        "videoSource": "https://video.wixstatic.com/video/ace175_c620ca06c1f64541ad648302cde83d68/720p/mp4/file.mp4",
        "videoCaption": "Meta × Blumhouse Enhanced Cinema — selected XR production footage.",
        "sourceUrl": "https://www.pavelzosim.com/projects/meta-blumhouse-xr-experience",
    },
    {
        "id": "PRJ-003",
        "slug": "airport-interaction-screen",
        "title": "Airport Operations Interaction Screen",
        "type": "Interactive / aviation visualization",
        "role": "Art Director / Technical Artist",
        "environment": "Unity HDRP / touch display / continuous operation",
        "status": "PRODUCTION",
        "summary": "Interactive airport-operations visualization combining a timeline-driven aircraft lifecycle, video playback, and touch-controlled camera navigation.",
        "overview": "An internal R&D interaction screen visualizing the complete aircraft lifecycle from taxi and takeoff through flight and landing. Synchronized animation, video playback, and an interactive camera created a continuous operational presentation.",
        "scope": [
            "Real-time touch-screen application",
            "Aircraft taxi, takeoff, flight, and landing animation",
            "Timeline-driven presentation synchronized with video",
            "Rotatable camera controlled through on-screen gestures",
        ],
        "constraints": [
            "Continuous 24/7 stability requirements",
            "Accurate spatial layout and operational representation",
            "Safety and compliance constraints",
            "Precise animation timing and scale",
            "Visual pacing suitable for extended viewing",
        ],
        "roleDetails": [
            "Art direction, motion graphics, and storyboard creation",
            "Airport props, markings, signage, and signals",
            "Level design and spatial layout",
            "Camera positioning and interaction logic",
            "Timeline design and video synchronization",
            "Aircraft lifecycle animation",
            "Integration planning with developers",
        ],
        "solutions": [
            "Built the real-time presentation in Unity HDRP",
            "Designed a timeline system for synchronized animation and playback",
            "Used Cinema 4D for concept development and motion design",
            "Generated procedural city content from OpenStreetMap data with Houdini and Python",
            "Integrated SpeedTree vegetation assets",
            "Balanced continuous visual pacing with long-running stability",
        ],
        "tools": ["Unity HDRP", "Houdini", "Cinema 4D", "SpeedTree", "Python"],
        "results": [
            "Delivered as an internal R&D demonstration",
            "Tested successfully for continuous-operation stability",
            "Validated the airport-operations visualization concept",
            "Established a technical and design base for future aviation interaction systems",
        ],
        "outcome": "The resulting system functioned as both a stable continuous presentation and a proof of concept for larger aviation-focused interactive visualization tools.",
        "videoSource": "https://video.wixstatic.com/video/ace175_cc5a44f6e318455abbcd0df755446e2e/720p/mp4/file.mp4",
        "videoCaption": "Airport Operations Interaction Screen — selected installation footage.",
        "sourceUrl": "https://www.pavelzosim.com/projects/airport-interaction-screen",
    },
    {
        "id": "PRJ-004",
        "slug": "deloitte-virtual-factory",
        "title": "Deloitte Virtual Factory — AR Digital Twin",
        "type": "AR / digital twin / multiplayer installation",
        "role": "Art Director / Technical Artist / UI–UX",
        "environment": "Unity / AR / exhibition installation",
        "status": "PRODUCTION",
        "summary": "AR-based digital-twin and multiplayer racing experience translating complex IoT concepts into a multi-zone public installation.",
        "overview": "The Virtual Factory was designed as an interactive sales-enablement and experiential-learning platform. It combined physical space, synchronized mobile devices, real-time visuals, and a story-driven representation of IoT concepts. The project evolved through several releases and culminated in Virtual Factory 3.0.",
        "scope": [
            "Real-time AR interactive installation",
            "Multiplayer experience across synchronized devices",
            "Multiple interactive zones in a public exhibition space",
            "Long-term iterative development culminating in Virtual Factory 3.0",
        ],
        "constraints": [
            "Device synchronization and stable public use",
            "Strict Deloitte brand and visual-consistency requirements",
            "Consistent UI across screen-space and world-space contexts",
            "Readable tiled floor markers from multiple viewing angles",
        ],
        "roleDetails": [
            "Screen-space and world-space UI design",
            "Custom UI rendering and water shaders",
            "9-slice UI, sprite sheets, and texture-atlas delivery",
            "Motion graphics for UI and narrative elements",
            "UI/UX decisions across gameplay and interaction flow",
            "Art direction within established brand guidelines",
            "Print design for AR safety and navigation floor markers",
            "Ownership of the UI delivery pipeline",
        ],
        "solutions": [
            "Designed UI systems shared across screen-space and world-space contexts",
            "Developed real-time UI shaders for performance and readability",
            "Built sprite-sheet assets and optimized texture layouts",
            "Used Houdini for procedural content and motion-graphics generation",
            "Used After Effects for prerendered motion graphics and visual prototyping",
            "Created tools for rapid Photoshop export and sprite-sheet generation",
        ],
        "tools": ["Unity", "Houdini", "After Effects", "Photoshop", "Illustrator"],
        "results": [
            "Deployed successfully as a live exhibition experience",
            "Thousands of visitors and more than 500 captured leads",
            "Stable real-time performance during public use",
            "Strong visitor and client feedback",
            "Project success led to a larger expanded version",
            "American Advertising Awards recognition",
            "Internal tools and Houdini setups reused on later productions",
        ],
        "outcome": "The installation made complex digital-twin and IoT concepts approachable through a stable, public-facing AR experience and established reusable UI and procedural workflows for later productions.",
        "videoSource": "https://video.wixstatic.com/video/ace175_6fc399c16a2e45f19c19eb629c1106aa/720p/mp4/file.mp4",
        "videoCaption": "Deloitte Virtual Factory — selected AR digital-twin footage.",
        "sourceUrl": "https://www.pavelzosim.com/projects/deloitte-virtual-factory",
    },
    {
        "id": "PRJ-005",
        "slug": "quantum-fiber-speed-zone",
        "title": "Quantum Fiber × Seahawks — Speed Zone",
        "type": "Interactive installation / real-time game",
        "role": "Technical Artist / VFX Artist",
        "environment": "Unreal Engine / gesture recognition / stadium installation",
        "status": "PRODUCTION",
        "summary": "Gesture-driven 100-yard digital dash for live Seahawks game days, combining real-time gameplay, branded VFX, and live leaderboard feedback.",
        "overview": "The Speed Zone was a public real-time installation at Lumen Field. Fans ran in place while AI-driven webcam gesture recognition propelled a virtual player through a recreated stadium environment, with large-screen feedback and a live leaderboard.",
        "scope": [
            "Real-time interactive stadium installation",
            "Gesture-based input through webcam and AI recognition",
            "Large-screen visuals and a live game loop",
            "CMS and backend integration for leaderboard and sharing",
        ],
        "constraints": [
            "High-traffic public game-day environment",
            "Unpredictable user input and system load",
            "Strong Quantum Fiber, Seahawks, and NFL brand requirements",
            "Immediate visual readability and low interaction latency",
        ],
        "roleDetails": [
            "Real-time shader and VFX development",
            "Gameplay-data-driven amplification effects",
            "Integration of VFX into the real-time gameplay loop",
            "Performance-conscious visual design for a public installation",
            "Alignment with existing brand and visual guidelines",
        ],
        "solutions": [
            "Implemented shaders and real-time VFX in Unreal Engine",
            "Used player velocity to drive and intensify visual effects",
            "Integrated AI-driven gesture input with the real-time experience",
            "Supported live leaderboard updates and content sharing",
            "Kept effects responsive and readable under variable public usage",
        ],
        "tools": ["Unreal Engine", "Custom shaders", "Real-time VFX", "AI gesture recognition", "CMS / backend systems"],
        "results": [
            "Deployed as a live game-day installation at Lumen Field",
            "Five times higher engagement than previous activations",
            "Three times more product-related conversations",
            "Strong positive client feedback",
            "2024 ADDY Gold and Silver awards",
        ],
        "outcome": "The installation proved that responsive gesture input and gameplay-driven VFX could sustain strong engagement in a demanding stadium environment while supporting measurable campaign outcomes.",
        "videoSource": "https://video.wixstatic.com/video/ace175_ddd2ae888eb746c9b2a62e5035ce85af/720p/mp4/file.mp4",
        "videoCaption": "Quantum Fiber Speed Zone — selected live installation footage.",
        "sourceUrl": "https://www.pavelzosim.com/projects/quantum-fiber-speed-zone",
    },
]


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def canonical_url(url: str) -> str:
    if "static.wixstatic.com/media/" in url and "/v1/" in url:
        return url.split("/v1/", 1)[0]
    return url


def suffix_for(url: str, content_type: str | None) -> str:
    suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return mimetypes.guess_extension((content_type or "").split(";", 1)[0]) or ".bin"


def download(url: str, project: dict, media_map: dict) -> str:
    existing = next((item for item in media_map["assets"] if item.get("sourceUrl") == url), None)
    if existing:
        return existing["localUrl"]
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = response.read()
        content_type = response.headers.get("Content-Type")
    digest = hashlib.sha256(payload).hexdigest()
    filename = f"asset-{digest[:16]}{suffix_for(url, content_type)}"
    output_dir = MEDIA_ROOT / project["slug"]
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / filename).write_bytes(payload)
    local = f"/public/media/projects/{project['slug']}/{filename}"
    media_map["assets"].append({
        "document": "content/projects/index.json",
        "sourceUrl": url,
        "localUrl": local,
        "bytes": len(payload),
        "sha256": digest,
    })
    return local


def project_images(project: dict, media_map: dict) -> list[str]:
    document = html.fromstring(fetch(project["sourceUrl"]))
    main_nodes = document.xpath("//main")
    root = main_nodes[0] if main_nodes else document
    urls = []
    for node in root.xpath(".//img"):
        raw = node.get("src") or node.get("data-src") or ""
        url = canonical_url(raw)
        if not url or any(media_id in url for media_id in COMMON_MEDIA_IDS) or url in urls:
            continue
        urls.append(url)
    return [download(url, project, media_map) for url in urls]


def write_shell(project: dict) -> None:
    page_dir = ROOT / "projects" / project["slug"]
    page_dir.mkdir(parents=True, exist_ok=True)
    description = escape(project["summary"], quote=True)
    title = escape(project["title"], quote=True)
    canonical = f'https://www.pavelzosim.com/projects/{project["slug"]}'
    image = f'https://www.pavelzosim.com{project["image"]}'
    structured_data = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": project["title"],
            "description": project["summary"],
            "url": canonical,
            "image": image,
            "author": {"@type": "Person", "name": "Pavel Zosim"},
        },
        ensure_ascii=False,
    ).replace("</", "<\\/")
    page = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<meta name="description" content="{description}"><title>{title} / Pavel Zosim</title>'
        f'<link rel="canonical" href="{canonical}">'
        '<meta property="og:type" content="article">'
        f'<meta property="og:title" content="{title} / Pavel Zosim">'
        f'<meta property="og:description" content="{description}">'
        f'<meta property="og:url" content="{canonical}">'
        f'<meta property="og:image" content="{image}">'
        '<meta name="twitter:card" content="summary_large_image">'
        f'<script type="application/ld+json">{structured_data}</script>'
        '<link rel="stylesheet" href="/styles/atlas.css"><link rel="stylesheet" href="/styles/projects.css">'
        f'</head><body class="project-site" data-project="{project["slug"]}">'
        '<script src="/scripts/project-page.js"></script>'
        '<noscript>This project record requires JavaScript to load its local content index.</noscript>'
        '</body></html>\n'
    )
    (page_dir / "index.html").write_text(page, encoding="utf-8", newline="\n")


def main() -> None:
    data = json.loads(PROJECT_INDEX.read_text(encoding="utf-8"))
    media_map = json.loads(MEDIA_MAP.read_text(encoding="utf-8"))
    by_slug = {project["slug"]: project for project in data["projects"]}
    for project in PROJECTS:
        images = project_images(project, media_map)
        if images:
            project["image"] = images[0]
            project["media"] = [
                {
                    "src": image,
                    "alt": f"{project['title']} production image {index:02d}",
                    "caption": f"Production record / image {index:02d}",
                }
                for index, image in enumerate(images, 1)
            ]
        video_source = project.pop("videoSource", None)
        video_caption = project.pop("videoCaption", None)
        if video_source:
            project["video"] = {
                "src": download(video_source, project, media_map),
                "caption": video_caption or "Selected production footage.",
            }
        by_slug[project["slug"]] = project
        write_shell(project)
        print(f"{project['slug']}: {len(images)} localized images; video={bool(video_source)}")
    ordered = []
    desired = ["nasa-first-woman"] + [project["slug"] for project in PROJECTS]
    for slug in desired:
        if slug in by_slug:
            ordered.append(by_slug[slug])
    data["projects"] = ordered
    PROJECT_INDEX.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    MEDIA_MAP.write_text(json.dumps(media_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Project records: {len(ordered)}; media assets: {len(media_map['assets'])}")


if __name__ == "__main__":
    main()
