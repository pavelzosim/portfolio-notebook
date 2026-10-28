# TOOL-004 — PBR Channel Packer

Status: implemented locally, pending publication. Registry: content/online-tools/index.json. Public route: /online-tools/pbr-channel-packer/.

## Purpose and scope

Local browser utility that packs grayscale texture masks into independent RGB/RGBA channels for Unreal Engine and Unity. Fourth Online Tool, following Sprite Sheet Assembly, Image Compressor and Noise Generator. No server or third-party processing service. Keep the interface compact and use the approved shared controls, previews and export panels.

Example: Concrete_AO.png, Concrete_Roughness.png and Concrete_Metallic.png produce Concrete_ORM.png: R = AO, G = Roughness, B = Metallic. Packing can reduce separate texture resources and shader samples; GPU-memory savings depend on compression, resolution and engine import settings, and must not be promised automatically.

## Workflow

1. Drop source images.
2. Choose Unreal ORM, Unity HDRP, Unity URP or Custom.
3. Assign a source image/channel or constant to each output channel.
4. Optionally invert channels; use Smoothness = 1 - Roughness for Unity when the input is roughness (do not invert an already-smoothness source).
5. Inspect individual channels and packed RGB/RGBA output.
6. Export RGB or RGBA PNG, from 256 up to 4096 pixels per side.

## Presets

| Output | Unreal ORM | Unity HDRP Mask Map | Unity URP Lit / Complex Lit |
| --- | --- | --- | --- |
| R | Ambient Occlusion | Metallic | Metallic |
| G | Roughness | Ambient Occlusion | Ambient Occlusion |
| B | Metallic | Detail Mask | Unused / constant |
| A | Omitted for RGB | Smoothness | Smoothness |

Unreal ORM is a common convention, not a required engine format. Unity URP 6 uses the same packed image in both Metallic and Occlusion slots. HDRP mapping follows package 17 documentation. Custom shader layouts require Custom mode. Revalidate presets when supported engine versions change.

## Controls and data handling

- Per-channel source image and input channel, constant 0–255, inversion, black/white points and gamma.
- Resolution and explicit resize/filter choice for mismatched source dimensions. Define aspect-ratio handling before implementation; never silently stretch inputs.
- Per-channel R/G/B/A and composite previews; RGB versus RGBA export.
- Preserve mask values as linear data; engine imports must disable sRGB. Browser image decoding/color metadata behaviour needs validation with known-value fixtures. Do not advertise bit-exact preservation until verified.
- Do not automatically treat an ordinary tangent-space normal map as a scalar mask: it contains multicomponent vector data.
- Define missing-channel defaults, transform order, file/pixel limits and memory use before implementation. Document what happens to unused alpha; no silent roughness inversion.
- Verify preservation of RGB values when alpha is zero: Canvas premultiplication must not silently erase packed masks. Select an export path that preserves independent data channels, including transparent pixels.

## Implemented data contract

- PNG: 8-bit, non-interlaced grayscale, grayscale-alpha, palette, RGB or RGBA. CRC and scanline sizes are validated; animated, interlaced and 16-bit PNG inputs are rejected explicitly. PNG profile/gamma metadata is ignored: masks are raw channel data. JPEG uses the browser decoder and is not a bit-exact mask source.
- Limits: 16 files, 64 MiB per file, 128 MiB per batch, 64 million decoded source pixels, 8192 pixels per source side. Output is 256–4096 pixels per side. Processing occurs in a Worker; no uploads.
- Resize defaults to matching aspect ratios. Differing ratios require an explicit Contain, Cover or Stretch choice. Contain fills empty space with that channel's constant. Nearest and bilinear filtering are available.
- Transform order: select source scalar channel (or constant), resize, clamp black/white levels, gamma using exponent 1/gamma, invert, round to 8-bit. Luminance uses 0.2126 R + 0.7152 G + 0.0722 B without sRGB conversion.
- Missing maps remain visible constants: AO 255, roughness 128, metallic/detail 0; Unity smoothness uses an existing smoothness source or inverted roughness. Editing a channel selects Custom. RGB omits alpha; Unity presets require RGBA.
- Export writes PNG bytes directly, independently of Canvas premultiplication. RGB beneath alpha zero is retained. Output has no sRGB, gamma or ICC chunks. Canvas is used only for the displayed preview (and JPEG decoding).
- Settings changes disable stale exports. Generation can be cancelled. PNG encoding is a separate operation; live previews are capped at 256 pixels (96 pixels per channel); full-resolution inspection previews at 512 pixels and exports use full resolution.

## Implementation verification

Run `node --test scripts/pbr-channel-core.test.cjs` and `node scripts/pbr-channel.browser.cjs <preview URL>`. Known-value fixtures verify packing order, alpha, constants, inversion, levels/gamma, resizing, PNG decoding, independent RGB bytes under transparent alpha and full 4096-square export. Browser tests exercise presets, channel previews, mobile geometry and cancellation. Engine import is documented but has not been tested inside Unity or Unreal.

## Primary references

- Unity URP channel-packed texture: https://docs.unity.com/en-us/engine/6000.0/manual/materials-and-shaders/built-in/shaders-in-universalrp/channel-packed-texture
- Unity HDRP mask/detail maps: https://docs.unity.cn/Packages/com.unity.render-pipelines.high-definition%4017.0/manual/Mask-Map-and-Detail-Map.html

Flow Map Generator is now registered as TOOL-005 with its own planned scope in flow-map-generator.md. No delivery date is assigned.

## Reviewed interface — 2026-10-28

Texture pool with thumbnails, followed by one shared channel-processing row per R/G/B/A and a final Compose preview. Source selection, input component, constant/padding, inversion and Levels remain visible in each row. Thumbnails show processed scalar output; they and Compose update automatically after edits. Reduced previews never enable export: Generate still prepares the full-resolution file. Settings changes invalidate old exports. The Style Guide contains one reusable row specimen; responsive layout preserves readable controls.
