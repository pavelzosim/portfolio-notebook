# Image Compressor — local draft

Route: /online-tools/image-compressor/
State: published; release 6 October 2026.

## Scope

PNG/JPEG/WebP still images; 10 files; 100 MiB source limit; 48 million decoded pixels; 8192 px maximum edge. Sequential canvas encoding, browser-native PNG/JPEG/WebP. JPEG flattens alpha onto chosen matte. WebP support checked against returned MIME type. No server uploads, external codecs or image network APIs.

Visual, data and pixel-art presets; maximum-edge resize without upscaling; optional independent down-POT axes; nearest or browser smooth filters. RGBA/R/G/B/Alpha inspection changes preview only. Previews fit to 1024 px edge; outputs retain selected dimensions. Batch ZIP uses stored entries with CRC32 and unique numbered names.

## Limits

Canvas 8-bit re-encoding is not bit-exact preservation of arbitrary ICC/high-depth/data inputs. No linear resampling, normal renormalisation, HDR/EXR, BCn/ASTC, mipmaps, lossless PNG optimiser or metadata preservation. Animation reduced to a still frame. PNG can grow in size; actual result displayed. Input memory checks after browser decoding cannot prevent every oversized-file allocation.

## Verification

Core tests: resize/no upscale, independent POT, invalid sizes, standard CRC32, safe unique filenames and ZIP header structure.
Browser: 11 inputs capped at 10; PNG alpha; JPEG matte; resize; changed settings invalidate outputs; corrupt file rejected; demo; ZIP download; 1440/390/320 px; no page errors or POST uploads.
ZIP checked with Python zipfile: 10 intact entries, decoded dimensions and known RGBA samples. Channel preview R/Alpha checked by pixel values. Website build/audit required before publication. Representative image, WebApplication schema, social metadata and sitemap registry configured for release.

Existing travel article remains unpublished. The travel article is excluded from this release.
`nNative-pixel loupe: linked UV position across source/encoded decoded bitmaps; 160 × 160 image pixels at 160 CSS pixels, channel inspection respected. Hover, tap, keyboard arrows/Escape. Tested with a 2048 px source using exact per-pixel values; preview thumbnails are not used as the loupe source.
