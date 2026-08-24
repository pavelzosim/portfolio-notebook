from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "media" / "brand"
SOURCE = BRAND_DIR / "pavel-zosim-brand-source.png"
OUTPUT = BRAND_DIR / "pavel-zosim-social-card.png"
FONT_REGULAR = Path(r"C:\Windows\Fonts\consola.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\consolab.ttf")

WIDTH, HEIGHT = 1200, 630
PAPER = "#e6dcd2"
RAISED = "#eee7df"
INK = "#0a0a0a"
MUTED = "#6d6761"
BLUE = "#0000aa"
DARK = "#171827"
CYAN = "#00e5d4"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def extracted_mark() -> Image.Image:
    source = Image.open(SOURCE).convert("RGB").crop((360, 120, 1180, 680))
    mask = Image.new("L", source.size)
    mask.putdata([
        255 if green > 105 and blue > 105 and red < 90 and green > red * 1.7 else 0
        for red, green, blue in source.get_flattened_data()
    ])
    bounds = mask.getbbox()
    if not bounds:
        raise RuntimeError("Brand mark could not be extracted")
    mask = mask.crop(bounds)
    mark = Image.new("RGBA", mask.size, CYAN)
    mark.putalpha(mask)
    mark.thumbnail((370, 410), Image.Resampling.LANCZOS)
    return mark


def main() -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)

    for y in range(18, HEIGHT, 24):
        for x in range(18, WIDTH, 24):
            draw.ellipse((x, y, x + 2, y + 2), fill="#c8beb5")

    draw.rectangle((0, 0, WIDTH, 18), fill=INK)
    draw.rectangle((40, 46, 706, 506), fill=RAISED, outline=INK, width=2)
    draw.rectangle((735, 46, 1160, 506), fill=DARK, outline=INK, width=2)

    draw.text((70, 72), "~/PORTFOLIO/TECHNICAL-ART", font=font(18, True), fill=MUTED)
    draw.line((70, 107, 676, 107), fill="#9f978f", width=1)
    draw.text((68, 132), "PAVEL ZOSIM", font=font(64, True), fill=INK)
    draw.text((70, 212), "TECHNICAL ARTIST", font=font(31, True), fill=BLUE)
    draw.text((70, 276), "REAL-TIME GRAPHICS & SYSTEMS", font=font(23, True), fill=INK)
    draw.text((70, 316), "PROCEDURAL WORKFLOWS · SHADERS · VFX", font=font(21), fill=INK)
    draw.text((70, 352), "PIPELINE AUTOMATION · PRODUCTION TOOLS", font=font(21), fill=INK)
    draw.line((70, 405, 676, 405), fill="#9f978f", width=1)
    draw.text((70, 431), "HOUDINI / UNITY / UNREAL / PYTHON", font=font(20, True), fill=MUTED)

    mark = extracted_mark()
    mark_x = 735 + (425 - mark.width) // 2
    mark_y = 46 + (460 - mark.height) // 2 - 8
    image.paste(mark, (mark_x, mark_y), mark)
    draw.text((846, 442), "AUTOMATE THE ART", font=font(17, True), fill=CYAN)

    draw.rectangle((40, 532, 1160, 588), fill=INK)
    draw.text((68, 549), "PAVELZOSIM.COM", font=font(23, True), fill="#f5eee7")
    draw.text((948, 552), "SYS.ONLINE", font=font(17, True), fill=CYAN)

    image.save(OUTPUT, "PNG", optimize=True)
    print(f"Built {OUTPUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
