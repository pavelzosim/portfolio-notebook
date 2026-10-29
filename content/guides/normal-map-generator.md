# Normal Map Generator — implementation and QA

TOOL-012 is independent from PBR Channel Packer. Existing roadmap IDs 005–011 remain unchanged and private. Entry point: `/online-tools/normal-map-generator/`. Shared shell, registry catalogue/carousels, input groups, disclosures, noise preview pair, notices and export buttons are reused without additional CSS or dependencies.

## Input and interpretation

One PNG/JPEG/WebP source, plus an optional OpenGL normal-detail layer. Maximum 64 MiB per image and 4096 px per side. PNG uses the existing validated raw decoder (8-bit, non-interlaced); it ignores color profiles. JPEG/WebP use the browser's decoder. Transparent RGB should be intentional: data maps are opaque RGB PNGs. Unsupported PNG formats fail explicitly.

Photo mode uses artistic luminance directly. Albedo mode linearizes sRGB before luminance. Height mode reads raw R. Normal mode only inspects/converts existing normals and blends optional detail; it does not invent a height solution. Photographic shadows, highlights and color changes can produce false relief. Roughness, AO, curvature and cavity are editable estimates; Metallic is not inferred.

The output is square. Crop origin is normalized to the source; crop extent is a fraction of its shorter side, so rectangular sources are cropped rather than stretched. Default is a full-size square at the top-left. Cropping precedes all derived maps.

## GPU stages

`scripts/material-map-gpu.js` owns WebGL 2 programs, textures and framebuffers. It requires `EXT_color_buffer_float`; R16F stores scalar fields and RG16F stores min/max reductions. Source and export buffers use RGBA8. Float render targets retain intermediate detail without quantizing every filter pass to 8 bits. Output is intentionally 8-bit PNG, not a 16-bit displacement workflow.

1. Crop, optional boundary correction, luminance, brightness/contrast, levels, gamma and inversion.
2. Optional Gaussian smoothing. Separable 15-tap weighted filters operate on a downsample pyramid for broad radii, then bilinear reconstruction. Radii are expressed at a 512-pixel reference to keep behavior consistent across preview/export sizes. Large and medium bases use reference radii 32 and 4.
3. Height = `0.5 + (large−0.5)×largeGain + (medium−large)×mediumGain + (source−medium)×fineGain`. Sharpen adds fine-band gain. Normal detail gains weight the same decomposition independently.
4. Optional min/max normalization uses a GPU reduction pyramid. Constant fields normalize to 0.5. Height and normal fields share the remapping range; normal smoothing is separate.
5. Central differences in normalized texture coordinates reconstruct unit tangent normals, using a 0.02 reference height multiplied by Normal Strength. Image rows increase downward; OpenGL normal Y is positive for a downward-increasing height field, DirectX reverses green. Explicit X/Y flips follow reconstruction. RNM blends the optional OpenGL detail normal.
6. Roughness uses base + height variation + high-frequency influence, independent levels/contrast/invert. AO averages positive height differences over 8/16/32 deterministic disk samples and applies exponential attenuation. Curvature is signed or separated positive/negative Laplacian response; cavity thresholds positive local Laplacian response. These are useful masks, not recovered physical properties.

Framebuffers and temporary textures are deleted after use; shaders are reused for the life of each processing context. Broad blur levels are downsampled to control cost. A separate export processor is disposed after each operation. Allocation/framebuffer errors and unsupported hardware stop with actionable messages. Context loss disables stale map exports; restoration rebuilds the preview resources.

## Seamless processing

Opposite-edge mirrored samples are blended near source boundaries before frequency decomposition; the user controls the blend width. Derived filters wrap their sample coordinates. A narrow terminal guard band and duplicated terminal output samples align border values, including normal output. This changes edge detail and can flatten or blur boundaries: it is not a promise of distortion-free synthesis. Normal detail sources should already tile.

The 3×3 view and reported maximum edge difference are inspection aids. Zero numerical border difference does not prove that an interior pattern repeats invisibly. Imported normal mode supports conversion/inspection, not photograph-based seam reconstruction.

## Preview and export

Live previews are 256 or 512 px, independently of the selected 256/512/1024/2048/4096 export size. Map selection, source/processed/split comparison, zoom, drag pan and 3×3 repetition are available. The analytic sphere/plane/cube uses dielectric GGX distribution, Schlick Fresnel and Smith-Schlick geometry, with editable directional lighting. Base Color is decoded to linear for shading; generated Normal, Roughness and approximate AO remain data. Height can be inspected as surface color; geometric displacement is not implemented. The viewer is for material evaluation, not an engine/IBL match.

`material-map-worker.js` handles image decoding, PNG compression and ZIP construction, reusing the existing raw PNG and ZIP utilities. ZIP contains aligned Height, Normal DX, Normal GL, Roughness, AO, Curvature and Cavity maps. No cloud service or uploads. Normal input exports only its converted normal map. PNG exports contain RGB bytes without sRGB/gamma/ICC chunks; engine imports should disable sRGB for these data maps. Base Color is previewed but not generated as a new albedo export.

## Channel Packer integration contract

The current integration is explicit file export/import plus a link to the existing tool. Packer source and algorithms are unchanged. An optional future IndexedDB handoff would store a short-lived bundle `{version, createdAt, maps:[{role,name,blob}]}` under a random token, pass only the token in the URL, and let Packer confirm/consume/delete it. Do not add a second packing interface or silently persist source images. This handoff is deliberately not implemented in this release.

## Validation

- `node --test scripts/material-map-core.test.cjs`: convention/flips/unit normals, frequency-band identity/isolation, RNM, settings/crop and filenames.
- `node scripts/material-map.browser.cjs <origin> <route>`: actual WebGL flat fields, sRGB luminance, ramp normal orientation, frequency differences, wrapped borders, resource disposal, uploaded PNG, all six views, comparison/tiling/material shape, mobile overflow, seven-map ZIP and actual 4096-square PNG.
- Shared site tests and `python scripts/audit_site.py` cover existing routes and component contracts. PBR Channel Packer browser tests remain separate.

Verified in local Edge/Chromium with WebGL 2. Firefox/Safari, mobile GPU memory, engine imports and broad photographic-art review still require device/manual validation; do not call those verified. GPU limits are checked before export, but allocation can still fail under system pressure. PNG's 8-bit precision and photograph-to-height ambiguity are explicit limitations.

Primary technical references: [Khronos floating-point color targets](https://registry.khronos.org/webgl/extensions/EXT_color_buffer_float/), [WebGL 2 format reference](https://www.khronos.org/files/webgl20-reference-guide.pdf). No external renderer code or dependency is copied.

Cube preview rasterizes six faces at a fixed orthographic three-quarter angle. Each face has its own orthonormal UV/tangent frame before the existing normal-map and GGX lighting evaluation. material-cube-preview.js reuses the shading body supplied by the shared viewer and owns/disposes its VAO, buffer and program. No texture-generation/export algorithms are changed.

## Surface inspection

Diffuse / Albedo is the initial source interpretation and Normal is the initial inspected map. Output convention is available in the basic settings: DirectX (negative Y) or OpenGL (positive Y). Image-derived normals are artistic estimates, not measured geometry. The selected map appears without lighting or color conversion on the preview shape. Choose Lit material for GGX material evaluation. Drag the cube with a mouse or touch to rotate it. Lighting controls are collapsed by default and affect the lit view only.

## Multiscale relief refinement (2026-10-28)

CrazyBump is the functional reference, not an implementation dependency. The generator now uses five telescoping bands separated at 1, 4, 16 and 64 pixels relative to a 512-pixel reference. The very-large, large, medium, fine and very-fine weights reconstruct the filtered source when all equal one. Separate normal weights leave exported Height unchanged. Sharpen boosts the very-fine residual.

Noise removal uses a 5x5 bilateral filter in linear luminance (spatial and range weights), blended by its amount. This preserves strong boundaries better than a plain Gaussian blur; weak real detail can still be removed. Broad-light reduction subtracts a 64-reference-pixel low-pass from luminance and recenters at 0.5. It is available for Photo and Diffuse/Albedo inputs, and defaults off. It cannot distinguish actual broad geometry from lighting or recover physically measured height.

Quality regression: `node scripts/material-map-quality.browser.cjs`. It verifies neutral-gain reconstruction, normal-only edits preserving Height, reduced checker noise with retained step contrast, attenuation of a broad illumination ramp, and GPU resource cleanup. These synthetic checks do not establish parity with CrazyBump on photographs. Specular/diffuse reconstruction and displaced geometry are not implemented by this refinement.

## Simplified public workflow (supersedes earlier UI scope)

Only Diffuse/Albedo and Height inputs are exposed. Four tabs retain relief controls, Normal strength/smoothing, basic Roughness and AO. Five relief bands are configured once. Curvature/Cavity, imported normal conversion, detail layering, manual crop and secondary levels are no longer exposed. ZIP exports five files: Height, Normal DX, Normal GL, Roughness, AO. Internal algorithm tests still exercise reusable processing contracts beyond the public UI.
`nPublic inspection now fits the whole image without zoom, pan, split-position, reset-view or tiled-preview controls. Comparison switches between Source and Processed; 3D cube rotation remains available.

Material Inspection wheel zoom: hover the loaded 3D canvas and scroll to change magnification between 0.5x and 4x. Applies to all shapes, retains scale across view changes, and does not affect exported texture resolution. Browser Ctrl+wheel remains available. The removed 2D zoom/tiling controls remain absent.
