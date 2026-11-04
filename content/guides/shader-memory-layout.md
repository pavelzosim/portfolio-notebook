# Shader Memory Layout

Version 1.0 · local browser calculator · TOOL-008
Route: /online-tools/shader-memory-layout/
Shared owners: scripts/shader-memory-core.js; lab/atlas-ui/memory-panel.js; lab/atlas-ui/memory-layout-view.js.
The live registry owns numbering, route, title and pictogram. No engine-specific packing is inferred from an engine name.

## Calculation contract

The selected profile is authoritative even if the source has a different buffer wrapper.
- DXC legacy cbuffer: scalar alignment, 16-byte row constraints, aggregate row starts and reusable aggregate tail space. The final logical block span is rounded to 16.
- DXC structured element: natural component alignment, maximum member alignment for structures, rounded structure size and array stride.
- Array stride and occupied extent are different. Four scalar cbuffer array elements start at 0,16,32,48; a following float3 may start at 52. The block span is 64.
- Multi-vector matrices align storage vectors to rows in cbuffer mode. Matrix orientation determines physical vectors. Single-storage-vector matrices follow vector rules.
- Default bool storage is four bytes; default half is float32. Native 16-bit mode maps half and minimum precision types to two-byte scalars.
- Default minimum precision values have four-byte storage and separate cbuffer rows from fixed-precision values. Native mode removes that separation.
- The declaration parser does not evaluate field values. Source is never executed, fetched from includes or uploaded. Fixed function examples have a separate numerical evaluator.

Payload is the sum of scalar storage. Extent reaches the end of an occupied field, including internal gaps. Span is the rounded block / element size. Padding is span minus payload. Repetitions multiply span and payload only: API allocation granularity, CBV alignment, descriptors, registers, cache, upload heaps, GPU timing and physical VRAM usage are excluded.

This is a documented rules implementation, not compiler reflection or a CPU ABI calculator. Vulkan std140/std430 and FXC-specific compatibility are not claimed.

## Accepted declarations

Scalars, numeric vectors 1–4, matrices 1–4 by 1–4, named structures, one-dimensional literal arrays, row_major/column_major qualifiers. Generic vector<T,N> and matrix<T,R,C> spellings are normalized. Comments and multiple field names in a declaration are accepted.

Inputs may be bare fields, named structures (the final one becomes the root if no root fields exist), one cbuffer with an optional register clause, or one StructuredBuffer/RWStructuredBuffer declaration referring to a named structure. Helpers must precede a buffer declaration. Matrices can override the default orientation per field.

Functions, expressions, initializers, preprocessor directives, packoffset, semantics, multidimensional arrays, resource members, typedefs and arbitrary compiler extensions are rejected. Explicit float16_t/int16_t/uint16_t require native mode. The calculator does not validate an entire shader.

32 KiB source, 128 fields per structure, depth 8, literal arrays up to 4096, 1 MiB logical layout, 16384 scalar components. Repetitions 1–1000000. Byte maps paginate 16 display rows, including structured profiles where 16 is only a display width.

## Reordering

Compare only top-level fields; nested layout, precision, qualifiers and array lengths stay fixed. Exhaustive search for up to 8 fields; bounded sort/swap heuristics above 8. Keep original order on ties and never return a larger layout. No claim of global optimality above 8 fields, lower register usage or faster rendering. Apply explicitly; update matching CPU writers and shader consumers together.

Source and settings edits invalidate suggestions and exports. Invalid source clears results rather than showing a stale calculation.

## Function presets

One Example dropdown groups buffer layouts, seven common HLSL functions (lerp, saturate, smoothstep, dot, normalize, reflect and mul), and the full raymarch shader. There are no separate top-level mode tabs. The shared data owner is lab/atlas-ui/memory-presets.js. Each function is a concrete overload with input declarations, a sample call, return type, short explanation and a link to the Microsoft HLSL reference.

These presets demonstrate hypothetical input buffers. Call strings are never executed or fed to the declaration parser. scripts/shader-function-study.js separately models the seven fixed formulas with editable numeric inputs, intermediate steps and scalar/vector results; function-study-panel.js renders them with existing Atlas components. Round inputs and modeled operations to float32, with a fixed non-fused ordering. Compiler reassociation, fused operations and intrinsic approximations may differ. Reject incomplete/nonfinite inputs, magnitudes above 1,000,000, nonfinite intermediates, zero-length normalize and smoothstep ranges that are reversed or collapse after float32 rounding. Reflect computes its algebraic formula for nonunit normals with an explicit note. Mul accepts logical matrix rows and a column vector, independently of storage orientation. A function result alone does not define a screen pixel; raymarch supplies a complete drawing context.

Results and temporaries are excluded from the byte map and budget; operator choice is not a register/VRAM estimate. A lerp float3/float3/float example has 28 B of input data, a 32 B legacy cbuffer span and a 28 B structured-element stride. The float3 return is not added to any of those totals.

Selection preserves profile, matrix orientation, native precision and repetitions. Calls remain valid after top-level reordering; editing a field name/type/array/qualifier switches the selection to Custom layout and hides the sample call. Invalid source hides it immediately. JSON exports include matched preset context separately from calculated declarations. Copy HLSL declarations continues to copy data declarations only.

Function behavior/type references: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-lerp (and the corresponding saturate, smoothstep, dot, normalize, reflect and mul reference pages linked by each preset).

## Visual contract

Reuse shared Atlas input/select/textarea, compact fieldsets, tabs, notices, tables, disclosures, actions and diagram frame. No tool CSS. Map rows contain numbered byte cells and hatched padding. Highlight uses existing selected tint. Hover/click explanations have an exact-byte numeric alternative; field selection and pagination are keyboard accessible. The canonical Style Guide has one compact three-row specimen covering the occupancy states.

Occupancy is useful scalar bytes divided by layout bytes. The header reports whole-layout occupancy; each display row has its own tint: ≥75% dense (note-success), ≥50% and <75% mixed (note-warning), <50% sparse (note-important). Thresholds are visual guidance, not hardware limits or performance criteria. The final structured row uses its actual span as the denominator, not an artificial 16 bytes. Selected-field blue takes precedence on cells; the offset label retains row tint. Text legends, percentages and hatching supplement color.

A separate report states whether field order has been checked. A smaller computed layout reports exact byte savings; exhaustive zero-savings applies only to permutations of current top-level fields. A bounded heuristic without savings never claims global optimality. Sparse or mixed rows can be required by packing rules and are never labeled incorrect.

## Verification

Run: node --test scripts/shader-memory-core.test.cjs
Browser: node scripts/audit_memory_browser.cjs (source lab on 8766), or node scripts/audit_memory_browser.cjs http://127.0.0.1:8767 --public (built site).
Fixtures cover documented row crossings, aggregate tail reuse, matrices, 16-bit/minimum precision, 64-bit vectors, nested arrays, parser rejection, byte partition invariants and non-growing reorder suggestions. Exported matrix declarations carry their effective orientation explicitly; native mode includes the required compiler flag. UI verification covers editing, tabs, profiles, errors, pagination, exports, mobile containment and public hydration.

Primary references:
- https://github.com/microsoft/DirectXShaderCompiler/wiki/Buffer-Packing
- https://github.com/microsoft/DirectXShaderCompiler/wiki/16-Bit-Scalar-Types
- https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-packing-rules

Learning context: From File to Pixel, Part 01 (Memory Hierarchy) and Part 03 (Memory Alignment / Struct Packing). Do not modify the lessons or invent hardware measurements while maintaining this calculator.

## Function → pixel / raymarch study

Raymarch is the full-shader example in the common Example dropdown: a bounded educational model of a fixed SDF sphere shader. Deep link: /online-tools/shader-memory-layout/#function-to-pixel. Owners: scripts/raymarch-study-core.js and raymarch-study-worker.js; shared lab/atlas-ui/memory-workspace.js, raymarch-study-panel.js and raymarch-study-view.js. No tool CSS is added. Source/math and controls describe the same fixed example; arbitrary HLSL editing/execution is deliberately outside this version.

VSMain generates three clip-space vertices from SV_VertexID. The documented reference draw is Draw(3,0), fullscreen viewport, culling/depth/blending disabled and one sample. CPU pixel centers correspond to top-left (x+0.5,y+0.5). RayDirection applies aspect ratio and vertical FOV. Raymarch checks maximum distance before each SDF call, then hit epsilon, and advances by signed sphere distance. Maximum samples are 1–128. A hit adds six central-difference SDF calls for the normal; a miss takes a sky-color branch without normal probes. Lighting yields linear RGB, followed by exposure, Reinhard tone mapping, explicit sRGB encoding and 8-bit quantization. The HLSL reference requires an R8G8B8A8_UNORM target, not an sRGB target, to avoid double encoding.

Canvas preview and selected-pixel prediction use the same CPU evaluator. Each modeled shader scalar operation is rounded with Math.fround, including vector operations, dot/length/normalize, SDF, t accumulation, central differences, shading, tone mapping and sRGB encoding. This is ideal non-fused float32 arithmetic, not GPU execution. Compiler reassociation, FMA, intrinsic approximations, denormal handling and render-target rounding can differ. There is no claim of bit-identical hardware results or a measured prediction-error bound; branches near hit thresholds may differ. Camera/light preparation occurs on the host, with buffer inputs rounded to float32. Stage nodes and value lifetimes are conceptual; there is no measured register allocation, shader timing, hardware occupancy, whole-frame instruction count or captured GPU execution.

The image renders lazily in a module Worker when the mode is opened. At most one job executes and one newest request waits; stale results are discarded. Settings are validated, frame dimensions bounded at 256 per axis, and sample limits bounded at 128. Picking accounts for contain-fit letterboxing; numeric X/Y and image arrow/Home keys provide keyboard alternatives. The slice contains the camera ray and sphere center. Previous/next/sample controls choose a recorded SDF sample. Graph click/Enter/Space selects a stage; table values link to a highlighted source line; uniform values link to parameter bytes. A miss explicitly marks the normal stage skipped.

The parameter layout has offsets 0,12,16,24,28,32,44,48,60,64,76,80. It contains 84 B of fields, a rounded 96 B layout span and 12 zero tail bytes in the displayed parameter representation. maxSteps is uint32; other fields are float32; all bytes are little endian. Changing MaxSteps, radius or exposure changes values rather than storage types/size. Load in Buffer layout replaces the editable layout with the example declarations, explicitly selecting the legacy cbuffer profile and highlighting the selected field.

This mode has no file exports: the purpose is observing a predicted path under explicit assumptions. Complete HLSL is readable inside the code tab. The selected sample shows d < hitEpsilon and links that decision to the condition in HLSL. The browser never reports a live HLSL compile result. The checked-in source generator is validated locally by DXC for VSMain/vs_6_0 and PSMain/ps_6_0; reflection offsets and 84-byte extent are compared with the calculator.

Checks: node --test scripts/raymarch-study-core.test.cjs; node scripts/audit_raymarch_dxc.cjs (DXC_PATH or installed Windows SDK / PATH); node scripts/audit_raymarch_browser.cjs (8766 source) or node scripts/audit_raymarch_browser.cjs http://127.0.0.1:8767 --public. Tests cover analytic sphere hits, misses and independent exits, aspect/pixel-center mapping, normals, transfer function, preview/trace agreement, binary packing, keyboard/nested tabs, invalid settings, rectangular-frame picking, mobile containment, input/color response and absence of export actions.

Float32 model reference: https://learn.microsoft.com/en-us/windows/win32/direct3d11/floating-point-rules. GPU latitude is wider than this chosen ideal operation ordering.

Unified example checks: node --test scripts/shader-function-study.test.cjs; node scripts/audit_shader_examples_browser.cjs (source) or node scripts/audit_shader_examples_browser.cjs http://127.0.0.1:8767 --public. Cover all seven default functions, edited inputs, intermediate-step navigation, invalid-input recovery, full-shader switching/deep links, layout-only examples and mobile containment.
