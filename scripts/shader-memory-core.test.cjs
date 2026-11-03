const {test}=require('node:test'),assert=require('node:assert/strict');
const core=()=>import('./shader-memory-core.js');
async function layout(source,settings={}){const m=await core();return m.calculateLayout(m.parseDeclarations(source),settings);}

test('documented cbuffer row crossing and exact small reorder',async()=>{
 const m=await core(),model=m.parseDeclarations('float gain; float4 tint; float bias;'),a=m.calculateLayout(model),b=m.suggestOrder(model);
 assert.deepEqual(a.rows.map(f=>f.offset),[0,16,32]);assert.equal(a.payload,24);assert.equal(a.span,48);assert.equal(a.padding,24);
 assert.equal(b.layout.span,32);assert.equal(b.saved,16);assert.equal(b.method,'Exhaustive top-level search');assert.equal(a.rows[0].name,'gain');
 assert.equal((await layout('float3 color; float roughness;')).span,16);
 assert.equal((await layout('float a; float b; float3 color;')).rows[2].offset,16);
});
test('DXC aggregate last-row reuse, distinct from rounded array stride',async()=>{
 const a=await layout('float weights[4]; float3 tint;');assert.deepEqual(a.rows.map(f=>f.offset),[0,52]);assert.equal(a.rows[0].arrayStride,16);assert.equal(a.span,64);assert.equal(a.payload,28);
 const b=await layout('struct S { float x; }; S data[2]; float y;');assert.deepEqual(b.rows.map(f=>f.offset),[0,20]);assert.equal(b.rows[0].size,20);assert.equal(b.span,32);
 const c=await layout('struct S { float x; }; S data; float y;');assert.equal(c.rows[1].offset,4);assert.equal(c.span,16);
});
test('structured buffer uses component alignment, aggregate stride and final struct padding',async()=>{
 const a=await layout('float gain; float3 color; float2 uv;',{profile:'structured'});assert.deepEqual(a.rows.map(f=>f.offset),[0,4,16]);assert.equal(a.span,24);
 const b=await layout('struct S { double x; float y; }; S data[2]; float z;',{profile:'structured'});assert.equal(b.rows[0].arrayStride,16);assert.equal(b.rows[1].offset,32);assert.equal(b.span,40);assert.equal(b.padding,12);
});
test('non-square matrix orientation and one-storage-row exception',async()=>{
 const a=await layout('float3x2 transform; float gain;');assert.equal(a.rows[0].matrixStride,16);assert.equal(a.rows[1].offset,28);assert.equal(a.span,32);
 const b=await layout('row_major float3x2 transform; float gain;');assert.equal(b.rows[1].offset,40);assert.equal(b.span,48);
 const c=await layout('float3x2 transform; float gain;',{profile:'structured'});assert.equal(c.rows[1].offset,24);assert.equal(c.span,28);
 assert.equal((await layout('row_major float1x3 a; float b;')).span,16);assert.equal((await layout('column_major float1x3 a;')).span,48);
 const d=await layout('row_major float2x3 m;');assert.deepEqual(d.segments.map(s=>s.path),['m[0][0]','m[0][1]','m[0][2]','m[1][0]','m[1][1]','m[1][2]']);
});
test('bool is four bytes, half storage follows compiler mode and min precision separates rows',async()=>{
 const source='half2 uv; float strength; half roughness; bool enabled;';
 const a=await layout(source),b=await layout(source,{native16:true});assert.equal(a.span,32);assert.equal(a.payload,20);assert.equal(b.span,16);assert.equal(b.payload,14);assert.deepEqual(b.rows.map(f=>f.offset),[0,4,8,12]);
 const c=await layout('min16float a; float b; min16float c;');assert.deepEqual(c.rows.map(f=>f.offset),[0,16,32]);
 const d=await layout('min16float a; float b; min16float c;',{native16:true});assert.deepEqual(d.rows.map(f=>f.offset),[0,4,8]);
 await assert.rejects(layout('float16_t x;'),/requires native/);
});
test('64-bit vectors use scalar alignment and may span rows',async()=>{
 const a=await layout('float x; double3 value; float y;');assert.deepEqual(a.rows.map(f=>f.offset),[0,16,40]);assert.equal(a.span,48);
 const b=await layout('float x; double3 value; float y;',{profile:'structured'});assert.deepEqual(b.rows.map(f=>f.offset),[0,8,32]);assert.equal(b.span,40);
});
test('parser handles comments, struct roots, wrappers, multiple names and generic vector/matrix',async()=>{
 const m=await core(),p=m.parseDeclarations('/* note */ struct Data { vector<float,3> color; float weight, opacity; }; StructuredBuffer<Data> values;');assert.equal(p.fields.length,3);assert.equal(p.fields[0].type,'float3');
 assert.equal(m.parseDeclarations('cbuffer Data : register(b1, space2) { matrix<float,3,2> m; };').fields[0].type,'float3x2');
 const a=m.parseDeclarations('struct Data { float3 a; float b; };');const b=m.parseDeclarations(m.formatDeclarations(a,{profile:'structured'}));assert.equal(m.calculateLayout(a).span,m.calculateLayout(b).span);
 const matrix=m.parseDeclarations('float3x2 m;');
 const exported=m.formatDeclarations(matrix,{major:'row_major',explicitMatrixOrder:true});
 assert.match(exported,/row_major float3x2/);
 assert.equal(m.calculateLayout(m.parseDeclarations(exported)).span,m.calculateLayout(matrix,{major:'row_major'}).span);
 assert.doesNotMatch(m.formatDeclarations(matrix,{major:'row_major'}),/row_major/);
 const structure=m.parseDeclarations('struct Box1x2 { float x; }; Box1x2 item;');
 assert.doesNotMatch(m.formatDeclarations(structure,{explicitMatrixOrder:true}),/column_major/);
});
test('unsupported code, overrides, recursion, invalid settings and unbounded input fail explicitly',async()=>{
 const m=await core();
 for(const source of ['float a = 2;','float4 main() { return 0; }','float a : packoffset(c0);','#include "file"','float x[0];','float x[5000];','float x; float x;','float x[2][2];'])assert.throws(()=>m.parseDeclarations(source),undefined,source);
 assert.throws(()=>m.calculateLayout(m.parseDeclarations('struct A { A a; }; A root;')),/Recursive/);
 assert.throws(()=>m.calculateLayout(m.parseDeclarations('struct A {}; A root;')),/Empty structures/);
 const chain='struct A0 { float x; };'+Array.from({length:8},(_,i)=>`struct A${i+1} { A${i} x; };`).join('');
 assert.throws(()=>m.calculateLayout(m.parseDeclarations(chain+' A0 first; A8 last;')),/nesting depth/);
 assert.throws(()=>m.calculateLayout(m.parseDeclarations('Texture2D map;')),/Unsupported/);
 assert.throws(()=>m.calculateLayout(m.parseDeclarations('float a;'),{profile:'std140'}),/Unknown/);
 assert.throws(()=>m.calculateLayout(m.parseDeclarations('float4x4 a[4096];')),/limit/);
 assert.throws(()=>m.parseDeclarations(' '.repeat(32769)),/32 KiB/);
});
test('every byte belongs to one component or padding, and heuristics never grow the original layout',async()=>{
 const m=await core();let seed=41;const next=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
 for(let run=0;run<30;run++){
  const types=['float','float2','float3','float4','double','bool','half2','float3x2'];
  const source=Array.from({length:9},(_,i)=>types[next()%types.length]+' field'+i+(next()%3?'':'[2]')+';').join('\n');
  const model=m.parseDeclarations(source),opts={profile:run%2?'structured':'cbuffer',native16:run%3===0},r=m.calculateLayout(model,opts),bytes=new Uint8Array(r.span);
  for(const item of [...r.segments,...r.holes])for(let b=item.offset;b<item.offset+item.size;b++){assert(b>=0&&b<r.span);bytes[b]++;}
  assert(bytes.every(v=>v===1));assert.equal(r.segments.reduce((n,s)=>n+s.size,0),r.payload);assert.equal(r.padding+r.payload,r.span);
  assert(m.suggestOrder(model,opts).layout.span<=r.span);
 }
});

test('function presets calculate declared inputs and preserve the call only while their types match',async()=>{
 const m=await core(),p=await import('../lab/atlas-ui/memory-presets.js');
 const expected={lerp:[28,32,28],saturate:[16,16,16],smoothstep:[12,16,12],dot:[24,32,24],normalize:[12,16,12],reflect:[24,32,24],mul:[80,80,80]};
 for(const [key,preset]of Object.entries(p.FUNCTION_PRESETS)){
  const model=m.parseDeclarations(preset.source),cb=m.calculateLayout(model),sb=m.calculateLayout(model,{profile:'structured'});
  assert.deepEqual([cb.payload,cb.span,sb.span],expected[key],key);
  assert(!model.fields.some(f=>f.name==='result'));assert.match(preset.call,new RegExp('^'+preset.resultType+' result = '+key+'\\('));
  assert(p.matchesMemoryPreset(key,model));assert(p.matchesMemoryPreset(key,{...model,fields:[...model.fields].reverse()}));
  const changed=structuredClone(model);changed.fields[0].name='renamed';assert.equal(p.matchesMemoryPreset(key,changed),false);
  changed.fields[0].name=model.fields[0].name;changed.fields[0].type='half';assert.equal(p.matchesMemoryPreset(key,changed),false);
 }
});

test('occupancy describes actual data bytes, including partial structured rows and pagination',async()=>{
 const m=await core(),v=await import('../lab/atlas-ui/memory-layout-view.js');
 const a=await layout('float gain; float4 tint; float bias;');
 assert.deepEqual(v.memoryRowOccupancy(a).map(r=>[r.used,r.capacity,r.band]),[[4,16,'sparse'],[16,16,'dense'],[4,16,'sparse']]);
 assert.deepEqual(v.occupancy(a.payload,a.span),{used:24,capacity:48,percent:50,band:'mixed'});
 const tail=await layout('float3 value;',{profile:'structured'});assert.deepEqual(v.memoryRowOccupancy(tail),[{offset:0,used:12,capacity:12,percent:100,band:'dense'}]);
 const spanning=await layout('double3 value;');assert.deepEqual(v.memoryRowOccupancy(spanning).map(r=>r.used),[16,8]);
 const paged=await layout('float values[20];');assert.deepEqual(v.memoryRowOccupancy(paged,{startRow:16,rowCount:16}).map(r=>r.offset),[256,272,288,304]);
 assert.equal(v.occupancy(12,16).band,'dense');assert.equal(v.occupancy(8,16).band,'mixed');assert.equal(v.occupancy(7,16).band,'sparse');
 const selected=v.memoryDiagram(a,{selected:'tint'});assert.match(selected,/fill="var\(--selected\)"/);assert.match(selected,/row 100% data/);
});
