// DXC buffer layouts, not GPU register allocation or resource-allocation sizes.
// Contracts and primary references: content/guides/shader-memory-layout.md.
export const LIMITS=Object.freeze({source:32768,fields:128,depth:8,array:4096,bytes:1048576,segments:16384});
const align=(n,a)=>Math.ceil(n/a)*a;
const ident=/^[A-Za-z_]\w*$/;
const reserved=new Set(['struct','cbuffer','return','void','if','else','for','while','switch','case','default','static','const','uniform','in','out','inout','row_major','column_major','register','true','false']);
const fail=message=>{throw new Error(message);};

export function parseDeclarations(source){
 if(typeof source!=='string'||source.length>LIMITS.source)fail('Source limit: 32 KiB.');
 const tokens=[];let pos=0,line=1;
 while(pos<source.length){
  const rest=source.slice(pos),match=/^(\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_]\w*|\d+|[{}\[\];,<>:()])/.exec(rest);
  if(!match)fail(`Line ${line}: unsupported syntax near “${rest.slice(0,24)}”. Enter data declarations, not executable shader code.`);
  const value=match[0];if(!/^\s|^\/\//.test(value)&&!value.startsWith('/*'))tokens.push({value,line});
  line+=(value.match(/\n/g)||[]).length;pos+=value.length;
  if(tokens.length>12000)fail('Too many source tokens.');
 }
 let i=0;const structures=Object.create(null);let fields=[],buffer=null,lastStruct=null,resource=null;
 const peek=()=>tokens[i]?.value;
 const error=message=>fail(`Line ${tokens[i]?.line||line}: ${message}`);
 const take=value=>{if(value&&peek()!==value)error(`Expected “${value}”; found “${peek()||'end of input'}”.`);return tokens[i++]?.value;};
 const name=()=>{if(!ident.test(peek()||''))error('Expected an identifier.');return take();};
 const integer=()=>{const n=Number(take());if(!Number.isInteger(n)||n<1||n>LIMITS.array)error('Array length must be a literal integer from 1 to 4096.');return n;};
 function declarations(until){
  const result=[],names=new Set();
  while(i<tokens.length&&peek()!==until){
   let major=null;if(['row_major','column_major'].includes(peek()))major=take();
   let type=name();
   if(['vector','matrix'].includes(type)&&peek()==='<'){
    const form=type;take('<');type=name();take(',');const a=integer();let b=null;if(form==='matrix'){take(',');b=integer();}take('>');type+=a+(b?'x'+b:'');
   }
   for(;;){
    const field=name();if(names.has(field))error('Duplicate field: '+field);names.add(field);
    let array=null;if(peek()==='['){take('[');array=integer();take(']');}
    result.push({name:field,type,array,major});if(result.length>LIMITS.fields)error('Maximum 128 fields per structure.');
    if(peek()!==',')break;take(',');
   }
   take(';');
  }
  return result;
 }
 while(i<tokens.length){
  if(peek()==='struct'){
   take();const id=name();if(Object.hasOwn(structures,id))error('Duplicate structure: '+id);
   take('{');structures[id]=declarations('}');take('}');take(';');lastStruct=id;
  }else if(peek()==='cbuffer'){
   if(buffer)error('Use one constant buffer at a time.');take();buffer=name();
   if(peek()===':'){take(':');take('register');take('(');name();if(peek()===','){take(',');name();}take(')');}
   take('{');fields=declarations('}');take('}');if(peek()===';')take(';');
   if(i<tokens.length)error('Place structures before the single cbuffer.');
  }else if(['StructuredBuffer','RWStructuredBuffer'].includes(peek())){
   if(resource||fields.length||buffer)error('Use one data root.');take();take('<');resource=name();take('>');name();take(';');
   if(i<tokens.length)error('Only one buffer declaration is supported.');
  }else{if(buffer||fields.length)error('Unsupported source after the data declarations.');fields=declarations();}
 }
 if(resource){if(!Object.hasOwn(structures,resource))fail('Unknown element structure: '+resource);fields=structures[resource];}
 else if(!buffer&&!fields.length&&lastStruct)fields=structures[lastStruct];
 if(!fields.length)fail('Add at least one field.');
 return {name:buffer||'LayoutData',fields,structures};
}

function scalarType(type,native16){
 const match=/^(min16float|min16int|min16uint|float16_t|int16_t|uint16_t|float32_t|int32_t|uint32_t|float64_t|int64_t|uint64_t|float|half|double|uint|int|bool)([1-4])?(?:x([1-4]))?$/.exec(type);
 if(!match)fail('Unsupported or unknown type: '+type+'. Use numeric types, vectors, 1–4 dimension matrices or named structures.');
 const base=match[1],rows=Number(match[2]||1),cols=match[3]?Number(match[3]):null;
 if(/^(float16_t|int16_t|uint16_t)$/.test(base)&&!native16)fail(base+' requires native 16-bit mode (DXC -enable-16bit-types).');
 const minimum=base.startsWith('min16');
 const size=/^(double|float64_t|int64_t|uint64_t)$/.test(base)?8:native16&&(minimum||base==='half'||base.endsWith('16_t'))?2:4;
 return {base,size,rows,cols,kind:minimum&&!native16?'minimum':'fixed'};
}

function settings(options){
 const profile=options.profile||'cbuffer',major=options.major||'column_major';
 if(!['cbuffer','structured'].includes(profile))fail('Unknown layout profile.');
 if(!['row_major','column_major'].includes(major))fail('Unknown matrix orientation.');
 return {profile,major,native16:Boolean(options.native16)};
}

function place(cursor,type,lastKind,legacy){
 const initial=cursor;let start=align(cursor,type.alignment),reasons=[];
 if(start!==cursor)reasons.push(`${type.alignment}-byte type alignment`);
 if(legacy){
  if(type.rowAligned){const next=align(start,16);if(next!==start)reasons.push('aggregate / matrix starts on a 16-byte row');start=next;}
  else{
   if(start%16&&Math.floor(start/16)===Math.floor(Math.max(0,cursor-1)/16)&&lastKind&&lastKind!==type.lastKind){start=align(start,16);reasons.push('minimum-precision and fixed-precision values use separate rows');}
   if(type.size>16||Math.floor(start/16)!==Math.floor((start+type.size-1)/16)){const next=align(start,16);if(next!==start)reasons.push('value would cross a 16-byte row');start=next;}
  }
 }
 return {start,end:start+type.size,gap:start-initial,reason:reasons.join('; ')||'Fits at the next aligned offset'};
}

function prepare(model,options){
 const cfg=settings(options),legacy=cfg.profile==='cbuffer',cache=new Map(),active=new Set();let depth=0;
 if(!model||!Array.isArray(model.fields)||!model.fields.length)fail('Add at least one field.');
 const structures=model.structures||{};
 function sequence(fields){
  if(!fields.length)fail('Empty structures are not supported. Add at least one field.');
  if(fields.length>LIMITS.fields)fail('Maximum 128 fields per structure.');
  let cursor=0,lastKind=null,payload=0,alignment=1,leaves=0,nesting=0;const members=[],names=new Set();
  for(const field of fields){
   if(!ident.test(field.name)||reserved.has(field.name)||/^(float|half|double|uint|int|bool)([1-4](x[1-4])?)?$/.test(field.name)||names.has(field.name))fail('Field names must be unique, non-reserved HLSL identifiers: '+field.name);names.add(field.name);
   const type=fieldType(field),position=place(cursor,type,lastKind,legacy);
   members.push({field,type,...position});cursor=position.end;lastKind=type.lastKind;payload+=type.payload;alignment=Math.max(alignment,type.alignment);leaves+=type.leaves;nesting=Math.max(nesting,type.nesting||0);
   if(cursor>LIMITS.bytes||leaves>LIMITS.segments)fail('Layout limit: 1 MiB / 16384 scalar components. Reduce arrays or nesting.');
  }
  return {members,size:legacy?cursor:align(cursor,alignment),extent:cursor,alignment:legacy?16:alignment,payload,leaves,lastKind,nesting};
 }
 function fieldType(field){
  if(field.major&&!['row_major','column_major'].includes(field.major))fail('Unknown matrix qualifier.');
  const key=field.type+':'+(field.major||cfg.major);let type=cache.get(key);
  if(!type){
   if(Object.hasOwn(structures,field.type)){
    if(field.major)fail('Matrix orientation cannot qualify a structure: '+field.name);
    if(active.has(field.type))fail('Recursive structure: '+field.type);
    if(++depth>LIMITS.depth)fail('Maximum nesting depth is 8.');active.add(field.type);
    const seq=sequence(structures[field.type]);active.delete(field.type);depth--;
    type={...seq,tag:'struct',rowAligned:legacy,nesting:seq.nesting+1};
   }else{
    const s=scalarType(field.type,cfg.native16);if(field.major&&!s.cols)fail('Matrix orientation requires a matrix: '+field.name);
    let count=1,components=s.rows,stride=0,rowAligned=false;
    const orientation=field.major||cfg.major;
    if(s.cols){count=orientation==='row_major'?s.rows:s.cols;components=orientation==='row_major'?s.cols:s.rows;rowAligned=legacy&&count>1;}
    const vectorBytes=components*s.size;stride=rowAligned?align(vectorBytes,16):vectorBytes;
    type={tag:s.cols?'matrix':'vector',size:(count-1)*stride+vectorBytes,alignment:rowAligned?Math.max(16,s.size):s.size,payload:count*vectorBytes,leaves:count*components,lastKind:s.kind,rowAligned,scalar:s.size,components,count,stride,orientation,rows:s.rows,cols:s.cols};
   }
   cache.set(key,type);
  }
  if(depth+(type.nesting||0)>LIMITS.depth)fail('Maximum nesting depth is 8.');
  if(field.array!=null){
   if(!Number.isInteger(field.array)||field.array<1||field.array>LIMITS.array)fail('Array length must be an integer from 1 to 4096.');
   const stride=align(type.size,legacy?16:type.alignment);
   type={tag:'array',element:type,count:field.array,stride,size:legacy?(field.array-1)*stride+type.size:field.array*stride,alignment:legacy?Math.max(16,type.alignment):type.alignment,rowAligned:legacy,payload:type.payload*field.array,leaves:type.leaves*field.array,lastKind:type.lastKind,nesting:type.nesting||0};
  }
  return type;
 }
 const root=sequence(model.fields);return {cfg,legacy,root,types:root.members.map(m=>m.type)};
}

export function calculateLayout(model,options={}){
 const {cfg,legacy,root}=prepare(model,options),span=align(root.size,legacy?16:root.alignment),segments=[];
 function emit(type,base,path,rootName,typeName){
  if(type.tag==='array'){for(let j=0;j<type.count;j++)emit(type.element,base+j*type.stride,path+'['+j+']',rootName,typeName);}
  else if(type.tag==='struct'){for(const member of type.members)emit(member.type,base+member.start,path+'.'+member.field.name,rootName,member.field.type);}
  else for(let j=0;j<type.count;j++)for(let k=0;k<type.components;k++){
   const component=type.tag==='matrix'?(type.orientation==='row_major'?`[${j}][${k}]`:`[${k}][${j}]`):type.components>1?'.'+('xyzw'[k]):'';
   segments.push({offset:base+j*type.stride+k*type.scalar,size:type.scalar,path:path+component,root:rootName,type:typeName});
  }
 }
 for(const member of root.members)emit(member.type,member.start,member.field.name,member.field.name,member.field.type);
 const rows=root.members.map(m=>({name:m.field.name,type:m.field.type,array:m.field.array||null,offset:m.start,size:m.type.size,payload:m.type.payload,alignment:m.type.alignment,arrayStride:m.type.tag==='array'?m.type.stride:null,matrixStride:m.type.tag==='matrix'?m.type.stride:null,paddingBefore:m.gap,reason:m.reason}));
 const holes=[];let cursor=0;
 for(const segment of segments){if(segment.offset>cursor)holes.push({offset:cursor,size:segment.offset-cursor});cursor=segment.offset+segment.size;}
 if(span>cursor)holes.push({offset:cursor,size:span-cursor});
 return {profile:cfg.profile,major:cfg.major,native16:cfg.native16,payload:root.payload,extent:root.extent,span,padding:span-root.payload,alignment:root.alignment,rows,segments,holes};
}

export function suggestOrder(model,options={}){
 const prep=prepare(model,options),fields=model.fields,n=fields.length,original=fields.map((_,i)=>i);
 function score(order){let cursor=0,lastKind=null;for(const i of order){const t=prep.types[i],p=place(cursor,t,lastKind,prep.legacy);cursor=p.end;lastKind=t.lastKind;}return align(cursor,prep.legacy?16:prep.root.alignment);}
 let best=original.slice(),bestSize=score(best),evaluated=0;
 const consider=order=>{evaluated++;const size=score(order);if(size<bestSize){bestSize=size;best=order.slice();}};
 if(n<=8){
  const visit=(path,remaining)=>{if(!remaining.length){consider(path);return;}for(const i of remaining)visit([...path,i],remaining.filter(j=>j!==i));};visit([],original);
 }else{
  for(const compare of [(a,b)=>prep.types[b].alignment-prep.types[a].alignment||prep.types[b].size-prep.types[a].size,(a,b)=>prep.types[b].size-prep.types[a].size,(a,b)=>(prep.types[b].size%16)-(prep.types[a].size%16)])consider(original.slice().sort(compare));
  for(let pass=0;pass<4&&evaluated<6000;pass++){const before=bestSize;for(let i=0;i<n&&evaluated<6000;i++)for(let j=i+1;j<n&&evaluated<6000;j++){const order=best.slice();[order[i],order[j]]=[order[j],order[i]];consider(order);}if(bestSize===before)break;}
 }
 const reordered={...model,fields:best.map(i=>fields[i])};
 return {model:reordered,layout:calculateLayout(reordered,options),saved:score(original)-bestSize,method:n<=8?'Exhaustive top-level search':'Bounded heuristic search',evaluated,order:best};
}

export function formatDeclarations(model,{profile='cbuffer',major='column_major',explicitMatrixOrder=false}={}){
 const declarations=fields=>fields.map(f=>{
  const qualifier=f.major||(explicitMatrixOrder&&!Object.hasOwn(model.structures||{},f.type)&&/x[1-4]$/.test(f.type)?major:null);
  return '    '+(qualifier?qualifier+' ':'')+f.type+' '+f.name+(f.array!=null?'['+f.array+']':'')+';';
 }).join('\n');
 const helpers=Object.entries(model.structures||{}).map(([name,fields])=>`struct ${name}\n{\n${declarations(fields)}\n};\n`).join('\n');
 let name=profile==='structured'?'LayoutElement':'LayoutData';while(Object.hasOwn(model.structures||{},name))name+='_';
 return helpers+(profile==='structured'?`struct ${name}\n{\n${declarations(model.fields)}\n};\n`:`cbuffer ${name}\n{\n${declarations(model.fields)}\n};\n`);
}

export const EXAMPLES=Object.freeze({
 padding:{title:'Reorder fields · 48 → 32 B',source:'float gain;\nfloat4 tint;\nfloat bias;'},
 fit:{title:'float3 + float · one row',source:'float3 color;\nfloat roughness;'},
 array:{title:'Array stride & tail reuse',source:'float weights[4];\nfloat3 tint;'},
 matrix:{title:'Matrix orientation',source:'float3x2 transform;\nfloat strength;'},
 half:{title:'Native 16-bit alignment',source:'half2 uv;\nfloat strength;\nhalf roughness;\nbool enabled;'},
 nested:{title:'Nested structure',source:'struct Surface\n{\n    float3 color;\n    float roughness;\n};\nSurface surfaces[2];\nfloat4 tint;'}
});
