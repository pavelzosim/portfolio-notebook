# Flow Map Generator v1.0

Route: `/online-tools/flow-map-generator/`, registry TOOL-005. This tool uses the existing Atlas shell, compact controls, preview pairs, actions and sidebar; it adds no page-local visual CSS.

## Workflow

Apply an editable preset or build a field from Directional, Radial, Vortex, Turbulence and Curl layers. Layer order runs top to bottom. Add blends decoded vectors; Weighted mix interpolates the current result. Layer strength, opacity, visibility and a radial mask are independent. Combined length is clamped to one; optional normalization sets every nonzero vector to unit length.

Add a Painted layer to correct the procedural base without destroying it. Painted layers default to Weighted mix. Stroke direction follows pointer movement; fixed direction uses the angle. Swirl and radial brushes use the local center. Smooth averages decoded vectors without renormalizing cancellations. Erase to underlying removes painted coverage; Erase to zero paints a neutral vector (use Weighted mix to erase the underlying base as well). Pen pressure modulates strength. Stamp spacing interpolates fast strokes; tile modes wrap the brush footprint. Shift-drag pans, wheel zooms, Reset view restores the view. Undo/Redo stores up to 20 complete snapshots, bounded to approximately 8 MiB; old snapshots are discarded first.

Project JSON v1 includes generator parameters/seeds, ordered layers and properties, every paint stamp, imported vector data, tile/normalization and export settings. It does not contain visualization-only particle state or the uploaded UV preview image. Save before applying a preset or resetting; these operations are also undoable while retained in history.

## Vector convention and encoding

UV +X points right and +Y points down in the exported top-origin PNG. An angle of 90 degrees points down; clockwise vortex at the right side of its center points down. Flip X/Y and rotation operate on decoded vectors before preview and export. DirectX/OpenGL do **not** imply universal flow-map Y conventions; consuming shaders determine the sign.

The ideal encoding is `RG = flow * 0.5 + 0.5`. 8-bit RGB cannot represent 0.5 exactly. This tool deliberately stores zero as byte 128 and uses an asymmetric quantizer, covering both -1 and +1:

```
encode(v) = round(128 + v * (v < 0 ? 128 : 127))
decode(b) = (b - 128) / (b < 128 ? 128 : 127)
```

Thus a neutral field decodes exactly to zero. Quantization error is at most 1/254 per component. The conventional `sampleRG * 2 - 1` remains approximately compatible, but byte 128 becomes +1/255. Apply a small neutral dead zone or use the exact decoder below. Imported PNGs use this same 128-neutral convention.

B can be a constant, combined magnitude, or layer coverage. A can be a constant or coverage. Coverage is accumulated as `1 - product(1 - layerOpacity * mask)`, independently of vector cancellation. RGB omits alpha; RGBA preserves it. PNG is encoded directly from vector bytes without sRGB metadata or GPU readback/vertical inversion.

## Procedural mathematics and seamless behavior

Turbulence and scalar potentials are deterministic sums of seeded periodic Fourier waves. Frequency is rounded to integer harmonics per octave for periodicity; lacunarity and persistence control their sequence/amplitudes. Domain distortion is periodic. Curl uses `(dPsi/dy, -dPsi/dx)`, analytic derivatives without domain warp and centered derivatives with it. Curl is divergence-free before composition within numerical tolerance. Strength, clipping, spatial masks and normalization can introduce divergence; the final composition does not claim incompressibility.

Tile X, Y and XY use periodic coordinates on selected axes. Radial/Vortex uses shortest toroidal displacement and a compact falloff that reaches zero before radius 0.49 in tiled modes, avoiding a direction jump at the antipode. Radius values above 0.49 are constrained in tiled modes. Radial masks use wrapped distance too. No encoded RGB edge blending is applied. Generated samples use matching endpoint coordinates; the diagnostic displays the largest opposite-edge vector/coverage difference. Imported maps should already have matching borders; the diagnostic exposes mismatches rather than silently modifying the source.

## Visualization

GPU WebGL 2 displays encoded RGB/channel/magnitude/neutral views and two-phase animated UV distortion. Arrow and streamline overlays use the actual floating combined field; small export quantization differences are expected. Streamlines and particles integrate bilinearly sampled vectors using RK2. Streamlines stop at the displayed boundary; wrapped particles restart their trails at crossings. Preview particle seeds are visual-only and do not affect deterministic export.

Particle trails are bounded histories. The five modes are Encoded flow, Arrows, Streamlines, Particles and UV distortion. A repeated 3x3 texture view is available; overlay integration is primarily intended for the central tile. Two UV phases offset by half a cycle blend to reduce reset popping; this demonstrates flow sampling, not a physically simulated fluid.

## Unreal / Unity

Disable sRGB and treat channels as linear mask/vector data. Use uncompressed data or validate target compression artifacts. Filtering and ordinary mipmaps affect direction and magnitude; test against the intended material and texture scale.

Exact neutral HLSL decoder (Unity Custom Function or Unreal Custom node with `rg` as the sampled R/G):

```hlsl
float2 b = rg * 255.0;
float2 flow = (b - 128.0) / lerp(float2(128,128), float2(127,127), step(128.0, b));
float phaseA = frac(Time * Speed);
float phaseB = frac(Time * Speed + 0.5);
float blend = abs(phaseA * 2.0 - 1.0);
float2 uvA = UV - flow * Strength * phaseA;
float2 uvB = UV - flow * Strength * phaseB;
// Sample the color texture at uvA and uvB, then lerp(a, b, blend).
```

GLSL uses `fract`, `mix` and `vec2` in place of `frac`, `lerp` and `float2`. In Shader Graph / Material Graph: sample linear RG, decode, multiply by phase and strength, subtract from UV, sample twice, blend. Larger vector magnitude increases displacement. If the consuming shader expects +V upward, enable Flip Y; do not choose it solely from the engine/API name.

## Processing, limits and memory

Procedural/composition/export math is CPU JavaScript; WebGL accelerates visualization. Export runs in a disposable Worker so Cancel can stop it. The working field and paint/import grids are 256x256. Procedural fields are evaluated at the chosen export size, while paint/import data is bilinearly resampled. 4K export does not invent high-resolution painted detail.

Limits: 8 layers, 4000 paint stamps, imported image 16 MiB / 4096 per side, JSON 32 MiB. Export 256/512/1024/2048/4096 RGB/RGBA PNG. 4K uses 64 MiB for RGBA plus transient encoder buffers; paint caches and project/history add memory. Actual process memory depends on browser implementation. Complex 4K multi-layer curl/warp fields can take considerably longer than simple fields. Preview is independent of output size.

WebGL 2 with 512 texture support is required for preview. Context loss pauses drawing; restoration recreates textures/programs from retained CPU data. Workers are terminated on completion/cancel/page exit; image bitmaps close after decoding and download URLs are revoked. No uploaded source or project leaves the browser.

## Validation

`node --test scripts/flow-core.test.cjs`: directions/handedness, deterministic periodic seeds, curl divergence, wrapped brushes, all brush types, exact neutral, channel mapping, rotation/flip/clamp, presets and project validation.

`node scripts/flow.browser.cjs [origin] [route]`: preset seams, interpolated strokes, Undo/Redo, project JSON round trip, layer operations, all five visualization modes, import neutral decoding, PNG bytes, cancel and actual 4096 PNG export, desktop/mobile geometry, no uploads/page exceptions. Verified in desktop Edge/Chromium; other browsers require their own QA. Optional EXR/16-bit, custom rectangular exports, symmetry and a node graph are not implemented.

Owners: `scripts/flow-core.js`, `flow-worker.js`, `flow-view.js`, `lab/atlas-ui/flow-panel.js`; registry imagery and shared route/build integration use the existing owners.
