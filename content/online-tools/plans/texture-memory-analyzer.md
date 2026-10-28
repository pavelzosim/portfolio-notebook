# TOOL-006 — Texture Memory Analyzer

Status: planned. Not implemented or released. Registry: content/online-tools/index.json.

Sixth Online Tool.

## Intended scope

Batch texture import; inspect resolution, NPOT dimensions, mip chains and channel information. Compare estimated storage under BC1, BC3, BC5, BC7 and selectable ASTC block sizes.

## Decisions before implementation

Report calculated texture payload, not measured GPU memory. Account for block rounding, small mip levels and selected mip count. Distinguish disk size, decoded image memory and hypothetical engine texture storage; engine streaming, alignment and import settings remain outside the estimate.

## Shared product rules

Use local browser processing and the approved Style Guide/shared component owners. This entry records scope, not a delivery date, release or compatibility guarantee. Define file/pixel limits, expected inputs and export contract before coding. Validate representative fixtures and error states, then review the UI before release. Planned tools have no working launch link, publication date, sitemap entry or live-carousel position.
