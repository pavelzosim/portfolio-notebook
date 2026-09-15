from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "media" / "brand" / "pavel-zosim-brand-source.png"
BRAND_DIR = ROOT / "public" / "media" / "brand"
ICO_OUTPUT = ROOT / "favicon.ico"

DARK = "#171827"
CYAN = "#00e5d4"
# Only the sizes actually referenced by a <link> tag (see add_favicon() in
# build_github_pages.py) get saved as standalone PNGs. 512 is generated only
# as the in-memory master to downsample the rest from -- keep it out of
# PNG_SIZES so a rerun doesn't leave an unreferenced file behind.
MASTER_SIZE = 512
PNG_SIZES = (16, 32, 180)
ICO_SIZES = ((16, 16), (32, 32), (48, 48))


def letters_mark() -> Image.Image:
    """Isolates just the "PZ" glyphs from the brand source, dropping the
    decorative corner crosshair ticks (same teal color, so a plain color
    filter alone can't tell them apart). A MinFilter erosion shrinks away
    the thin ticks/dots while the much thicker letter strokes survive;
    that eroded bbox (plus padding) then crops the real, unshrunk mask."""
    source = Image.open(SOURCE).convert("RGB")
    width, height = source.size
    pixels = source.load()
    mask = Image.new("L", source.size)
    mask_pixels = mask.load()
    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y]
            mask_pixels[x, y] = 255 if (green > 105 and blue > 105 and red < 90 and green > red * 1.7) else 0

    eroded = mask.filter(ImageFilter.MinFilter(19))
    bounds = eroded.getbbox()
    if not bounds:
        raise RuntimeError("Letters could not be isolated")
    pad = 20
    x0, y0, x1, y1 = bounds
    crop_box = (max(0, x0 - pad), max(0, y0 - pad), min(width, x1 + pad), min(height, y1 + pad))

    letters = mask.crop(crop_box)
    mark = Image.new("RGBA", letters.size, CYAN)
    mark.putalpha(letters)
    return mark


def square_icon(size: int, mark: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), DARK)
    pad = round(size * 0.16)
    box = size - pad * 2
    fitted = mark.copy()
    fitted.thumbnail((box, box), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.paste(fitted, (x, y), fitted)
    return canvas


def main() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    mark = letters_mark()
    largest = square_icon(MASTER_SIZE, mark)

    for size in PNG_SIZES:
        icon = largest.resize((size, size), Image.Resampling.LANCZOS)
        out = BRAND_DIR / f"favicon-{size}.png"
        icon.save(out, "PNG", optimize=True)
        print(f"Built {out} ({size}x{size})")

    ico_frames = [largest.resize(size, Image.Resampling.LANCZOS) for size in ICO_SIZES]
    ico_frames[0].save(ICO_OUTPUT, format="ICO", sizes=ICO_SIZES, append_images=ico_frames[1:])
    print(f"Built {ICO_OUTPUT} ({', '.join(f'{w}x{h}' for w, h in ICO_SIZES)})")


if __name__ == "__main__":
    main()
