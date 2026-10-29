# SDF Texture Generator v1.0

Entry: `/online-tools/sdf-texture-generator/`. Registry: `content/online-tools/index.json`, TOOL-008. All files remain in the browser; processing uses a disposable module Worker. No upload endpoint or external rendering service is used.

## Workflow

1. Load PNG with alpha, or a supported SVG. WebP and JPG are also accepted; JPG selects luminance automatically.
2. Choose alpha or luminance threshold. Set padding, source scale/offset and preserve aspect ratio. Non-square inputs are centered and fitted, not stretched unless aspect preservation is disabled.
3. Set Distance Range in output pixels. Bias expands positive interiors; Invert reverses the sign. Preview updates after edits; Update preview also runs explicitly.
4. Inspect source, signed distance or reconstructed silhouette. Scroll to zoom, drag to pan; double-click resets the shared view.
5. Choose Outline, Glow, Dissolve or Soft edge. Effect parameters update the shader without recomputing the field.
6. Choose 256, 512, 1024, 2048 or 4096 and export `SDF_<name>_<size>.png`. Export recomputes at full resolution. Cancel terminates its Worker.

## Mathematical contract

Thresholding creates a binary union of square pixel cells. The zero contour is its exposed cell edges, including the outer canvas boundary. Distances are measured at pixel centers, positive inside and negative outside. This is exact Euclidean distance to that **raster boundary**, not an analytic vector-path SDF and not a blur, chamfer approximation or jump-flood approximation.

The boundary is represented on a half-pixel lattice. For every output pixel center, the closest point on an axis-aligned cell edge is either an endpoint or its orthogonal projection; both belong to that lattice. A horizontal nearest-seed pass followed by an exact generalized squared-distance lower-envelope transform therefore finds the exact nearest boundary. Complexity and intermediate storage are O(width × height).

`encoded = clamp(0.5 + distance / (2 × range), 0, 1)`

The file stores `round(encoded × 255)` in identical RGB channels, with no alpha or sRGB metadata. Decode with `(sample.r - 0.5) × 2 × range`. At 8 bits, 0.5 lies between codes 127 and 128. Maximum unsaturated distance quantization error is range/255 output pixels. Distances beyond the selected range saturate; effects wider than that range cannot recover missing distance. Threshold 0.5 reconstructs the binary classification at pixel centers (before bias/invert).

The 512 preview scales range, padding and bias with output size, so UI effect units remain output pixels. Fine geometry can change when rasterized at another resolution. Anti-aliased source edges are thresholded; the result does not claim subpixel vector accuracy. SVG 2x sampling improves rasterization before the final threshold but is not MSDF or analytic curve distance.

An empty silhouette exports all outside; a fully opaque image has a boundary at the canvas edges. Padding leaves room for outside effects. Offset or excess scale may clip geometry at the output boundary.

## Shader integration

Disable sRGB. Treat the texture as linear scalar data. Avoid lossy color compression where contour precision matters. Bilinear filtering is useful for reconstruction; mipmaps may alter distance values and should be assessed for the intended effect. Keep the generation range with the material.

HLSL fragment example (Unity or Unreal Custom expression adapted to the engine's texture binding):

```hlsl
float d = (SdfTexture.Sample(SdfSampler, UV).r - 0.5) * (2.0 * Range);
float aa = max(fwidth(d), 0.001);
float alpha = smoothstep(-aa, aa, d);
```

GLSL fragment equivalent:

```glsl
float d = (texture(sdfTexture, uv).r - 0.5) * (2.0 * range);
float aa = max(fwidth(d), 0.001);
float alpha = smoothstep(-aa, aa, d);
```

Effect expressions, using decoded `d` and a softness `aa`:

- Outline: `1 - smoothstep(Width/2, Width/2 + aa, abs(d - Offset))`. Multiply by reconstructed interior or its complement for inside/outside placement.
- Outer glow: `pow(clamp(1 - max(-d, 0)/Radius, 0, 1), Falloff) * Intensity * (1 - alpha)`. Inner glow uses `max(d,0)` and `alpha`.
- Dissolve: add seeded value noise in distance units, subtract the dissolve offset, then reconstruct with smoothstep. A separate positive-distance band colors the exposed rim. The tool's SHADERS section provides the full seeded noise function in HLSL or GLSL.
- Soft edge: `pow(smoothstep(-Width, Width, d - Offset), Falloff) * Opacity`. This is a soft opacity mask, not scene-depth soft particles.

Unreal nodes: Texture Sample (linear/masks) → R → Subtract 0.5 → Multiply (2 × Range) → SmoothStep. Unity Shader Graph: Sample Texture 2D → Split R → Subtract 0.5 → Multiply (2 × Range) → Smoothstep. Supply negative and positive edge widths around zero; connect the reconstructed result to the material's opacity/alpha workflow. Derivatives belong to fragment shading.

## Limits and lifecycle

Raster: 32 MiB, 8192 px per side, 64 million pixels. SVG: 1 MiB, 5000 elements, depth 32; geometry, local gradients/clips/masks and fragment references only. Scripts, events, external resources, images, styles, text/fonts and animation are rejected. Parsed SVG is never inserted in the page. SVG 2x supports output through 2048; use 1x for 4096.

4K processing uses roughly 250–350 MiB of typed arrays/canvas data before transient PNG encoding/browser allocations. Actual browser memory is implementation dependent; low-memory devices can fail at 4K. Workers are terminated after each result or cancellation, transferred bitmaps are closed, and object URLs are revoked. WebGL failure disables effects while generation/export remain available.

Owners: `scripts/sdf-core.js` (pure exact transform), `sdf-worker.js` (raster/threshold/export), `sdf-svg.js` (inert SVG subset), `sdf-preview.js` (four GPU effects), `lab/atlas-ui/sdf-panel.js` (UI lifecycle). Uses existing Atlas control, stable tabs, preview, sidebar and tool catalogue components; no article-local or tool-local visual CSS.

## Verification

`node --test scripts/sdf-core.test.cjs`: independent brute boundary oracle for rectangles, concavity, holes, islands, thin/opaque/empty masks, randomized non-square inputs, sign/bias/range and quantization.

`node scripts/sdf.browser.cjs [origin] [route]`: SVG rejection, raster/SVG input, all four shader parameter responses, responsive layout, grayscale RGB PNG decoding, cancellation, actual 4096 PNG download, reset, no page errors or uploads.

## v1.1: MSDF

MSDF is deferred. It requires vector contour extraction/input, edge coloring, independent signed distances to edge groups, robust sharp-corner handling and median reconstruction, plus a separate validation suite. Writing the same scalar distance into three RGB channels is ordinary SDF and must never be advertised as MSDF.
