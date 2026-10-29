# TOOL-008 — SDF Texture Generator

Status: planned. Not implemented or released. Registry: content/online-tools/index.json.

Eighth Online Tool.

## Intended scope

Input transparent PNG or SVG; controls for Distance Range, Threshold, Padding, Invert and Edge Smoothing. Preview Outline, Glow, Dissolve and Soft Particle Mask effects.

## Decisions before implementation

Define inside/outside sign, pixel-distance units, alpha threshold, padding and export encoding. Distinguish single-channel SDF from MSDF. Validate distances against reference shapes and handle SVG rasterization explicitly.

## Shared product rules

Use local browser processing and the approved Style Guide/shared component owners. This entry records scope, not a delivery date, release or compatibility guarantee. Define file/pixel limits, expected inputs and export contract before coding. Validate representative fixtures and error states, then review the UI before release. Planned tools have no working launch link, publication date, sitemap entry or live-carousel position.

## Implemented v1.0 (2026-10-29)
Exact raster-boundary SDF, four shader previews and 4K PNG. See content/guides/sdf-texture-generator.md. MSDF is explicitly deferred to v1.1 and requires a separate vector edge-coloring algorithm and tests; RGB replication of scalar SDF does not qualify.
