import {EXAMPLES,parseDeclarations} from '../../scripts/shader-memory-core.js';
const reference=name=>'https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-'+name;
// Each preset is one concrete overload, with a hypothetical buffer of inputs.
// Call strings never enter the declaration parser or execute as source code.
// Fixed numerical models live separately in scripts/shader-function-study.js.
export const FUNCTION_PRESETS=Object.freeze({
 lerp:{title:'lerp · blend float3 colors',source:'float3 colorA;\nfloat3 colorB;\nfloat blend;',description:'Blend between two colors. A blend outside 0–1 extrapolates; lerp does not clamp it.',call:'float3 result = lerp(colorA, colorB, blend);',resultType:'float3',reference:reference('lerp')},
 saturate:{title:'saturate · clamp float4 to 0–1',source:'float4 value;',description:'Clamp each component to the 0–1 range. The result keeps the input type and component count.',call:'float4 result = saturate(value);',resultType:'float4',reference:reference('saturate')},
 smoothstep:{title:'smoothstep · smooth scalar mask',source:'float edgeStart;\nfloat edgeEnd;\nfloat value;',description:'Create a smooth 0–1 mask between two thresholds. Use edgeStart < edgeEnd.',call:'float result = smoothstep(edgeStart, edgeEnd, value);',resultType:'float',reference:reference('smoothstep')},
 dot:{title:'dot · float3 vectors to scalar',source:'float3 directionA;\nfloat3 directionB;',description:'Reduce two float3 vectors to one scalar. With unit vectors, the result is the cosine of their angle.',call:'float result = dot(directionA, directionB);',resultType:'float',reference:reference('dot')},
 normalize:{title:'normalize · unit float3 direction',source:'float3 direction;',description:'Scale a nonzero vector to unit length. A zero-length input has an undefined result.',call:'float3 result = normalize(direction);',resultType:'float3',reference:reference('normalize')},
 reflect:{title:'reflect · reflected float3 direction',source:'float3 incident;\nfloat3 surfaceNormal;',description:'Reflect an incident vector about a surface normal. Supply a unit-length surfaceNormal for the geometric reflection.',call:'float3 result = reflect(incident, surfaceNormal);',resultType:'float3',reference:reference('reflect')},
 mul:{title:'mul · transform a float4 position',source:'float4x4 transform;\nfloat4 position;',description:'Multiply a matrix by a column vector. Matrix storage order changes byte placement independently of this multiplication order.',call:'float4 result = mul(transform, position);',resultType:'float4',reference:reference('mul')}
});
export const MEMORY_PRESETS=Object.freeze({...EXAMPLES,...FUNCTION_PRESETS});
const signature=model=>JSON.stringify({fields:model.fields.map(f=>[f.name,f.type,f.array,f.major]).sort((a,b)=>a[0].localeCompare(b[0])),structures:model.structures});
const signatures=new Map(Object.entries(MEMORY_PRESETS).map(([key,preset])=>[key,signature(parseDeclarations(preset.source))]));
// Reordering preserves a call that references fields by name. Renaming or changing
// a type invalidates that call instead of displaying stale function information.
export const matchesMemoryPreset=(key,model)=>signatures.has(key)&&signatures.get(key)===signature(model);
