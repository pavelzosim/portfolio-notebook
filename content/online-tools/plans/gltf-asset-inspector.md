# TOOL-009 — glTF Asset Inspector

Status: planned. Not implemented or released. Registry: content/online-tools/index.json.

Ninth Online Tool. Focus on production validation rather than a generic viewer.

## Intended scope

Import GLB/glTF; inspect triangle/vertex counts, materials, hierarchy, UV channels, vertex colors, tangents, normals and textures. Check missing attributes, UV islands and configurable naming conventions.

## Decisions before implementation

Specify glTF version/extensions and external resource handling. Distinguish unique versus instanced geometry and indexed versus expanded counts. Define UV-island connectivity and validation profiles; report unsupported data rather than silently omitting it.

## Shared product rules

Use local browser processing and the approved Style Guide/shared component owners. This entry records scope, not a delivery date, release or compatibility guarantee. Define file/pixel limits, expected inputs and export contract before coding. Validate representative fixtures and error states, then review the UI before release. Planned tools have no working launch link, publication date, sitemap entry or live-carousel position.
