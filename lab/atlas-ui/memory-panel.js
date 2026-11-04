import {parseDeclarations,calculateLayout,suggestOrder,formatDeclarations,EXAMPLES,LIMITS} from '/scripts/shader-memory-core.js';
import {renderMediaTabs,setupMediaTabs} from './media-tabs.js?v=review-198';
import {memoryDiagram,occupancy} from './memory-layout-view.js?v=review-197';
import {FUNCTION_PRESETS,MEMORY_PRESETS,matchesMemoryPreset} from './memory-presets.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bytes=value=>Number(value).toLocaleString('en-US')+' B';
const baseTypes=['float','float2','float3','float4','int','int2','int3','int4','uint','uint2','uint3','uint4','bool','half','half2','half3','half4','float16_t','int16_t','uint16_t','min16float','min16float2','min16float3','min16float4','min16int','min16uint','double','double2','double3','double4','int64_t','uint64_t',...Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>`float${r+1}x${c+1}`)).flat()];
export function setupMemoryPanel(root,{onExampleChange=()=>{}}={}){
 const $=id=>root.querySelector('#layout-'+id),source=$('source'),status=$('status');let model=parseDeclarations(EXAMPLES.padding.source),original=null,suggestion=null,page=0,timer=null,selectedExample='padding';
 const options=()=>({profile:$('profile').value,major:$('major').value,native16:$('native16').checked});
 const active=()=>suggestion&&$('view').value==='suggested'?suggestion.layout:original;
 const tell=(text,error=false)=>{status.textContent=text;status.setAttribute('role',error?'alert':'status');};
 const controls=$('fields');
 const tabsHost=$('input-tabs');tabsHost.innerHTML=renderMediaTabs([{id:'layout-fields-tab',title:'Fields',html:''},{id:'layout-code-tab',title:'HLSL declarations',html:''}],escape,{label:'Data input'});
 tabsHost.querySelector('#layout-fields-tab').append(controls,$('add'));
 tabsHost.querySelector('#layout-code-tab').append($('source-label'));
 setupMediaTabs(tabsHost);
 const presetOptions=presets=>Object.entries(presets).map(([key,e])=>`<option value="${key}">${escape(e.title)}</option>`).join('');
 $('examples').innerHTML='<option value="custom">Custom data layout</option><optgroup label="Buffer layout examples">'+presetOptions(EXAMPLES)+'</optgroup><optgroup label="Functions · numerical prediction">'+presetOptions(FUNCTION_PRESETS)+'</optgroup><optgroup label="Full shader · pixel prediction"><option value="raymarch">Raymarch · SDF sphere → pixel</option></optgroup>';
 function functionExample(){return FUNCTION_PRESETS[selectedExample]||null;}
 function example(){
  if(!matchesMemoryPreset(selectedExample,model))selectedExample='custom';
  $('examples').value=selectedExample;const preset=functionExample();$('function').hidden=!preset;
  onExampleChange(preset?selectedExample:'custom',selectedExample);
  if(!preset)return;
  $('function-description').textContent=preset.title+' — '+preset.description;
  $('function-code').textContent=preset.call;
  $('function-reference').href=preset.reference;
  $('function-reference').textContent=preset.title.split(' · ')[0]+' · HLSL reference ↗';
 }
 function fields(){
  const types=[...new Set([...baseTypes,...Object.keys(model.structures||{}),...model.fields.map(f=>f.type)])];
  controls.innerHTML=model.fields.map((f,i)=>`<fieldset class="control-group control-group--compact" data-field="${i}"><legend>Field ${String(i+1).padStart(2,'0')}</legend><label>Name<input data-key="name" value="${escape(f.name)}" maxlength="64" aria-label="Field ${i+1} name"></label><label>Type<select data-key="type" aria-label="Field ${i+1} type">${types.map(type=>`<option ${type===f.type?'selected':''}>${escape(type)}</option>`).join('')}</select></label><label>Array length · 0 = single<input data-key="array" type="number" min="0" max="${LIMITS.array}" step="1" value="${f.array||0}" aria-label="Field ${i+1} array length"></label><div><span class="control-hint">Order / remove</span><div class="tool-actions"><button class="button button--quiet" type="button" data-action="up" aria-label="Move field ${i+1} up" ${i===0?'disabled':''}>↑</button><button class="button button--quiet" type="button" data-action="down" aria-label="Move field ${i+1} down" ${i===model.fields.length-1?'disabled':''}>↓</button><button class="button button--quiet" type="button" data-action="remove" aria-label="Remove field ${i+1}" ${model.fields.length===1?'disabled':''}>Remove</button></div></div>${f.major?`<p class="control-hint">Explicit ${escape(f.major)}. Edit matrix qualifier in HLSL.</p>`:''}</fieldset>`).join('');
  $('add').disabled=model.fields.length>=LIMITS.fields;
 }
 function invalidate(){suggestion=null;$('view').value='original';$('view').options[1].disabled=true;$('use').disabled=true;$('comparison').replaceChildren();}
 function clearResults(message){original=null;invalidate();$('function').hidden=true;$('packing').hidden=true;onExampleChange('custom',selectedExample);for(const id of ['summary','map','packing','offsets','detail'])$(id).replaceChildren();$('suggest').disabled=$('export').disabled=$('copy').disabled=true;tell(message,true);}
 function table(title,head,rows){return `<div class="atlas-table-frame atlas-table-frame--solid"><div class="atlas-table-header-solid">[ ${escape(title)} ]</div><div class="atlas-table-body"><table class="atlas-table"><thead><tr>${head.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;}
 function summary(){
  const r=active(),count=Number($('count').value);if(!r)return;
  if(!Number.isInteger(count)||count<1||count>1000000){$('summary').replaceChildren();tell('Repetitions must be an integer from 1 to 1,000,000.',true);$('export').disabled=true;return false;}
  $('summary').innerHTML=table('LAYOUT BUDGET',['Metric','One block / element','Repeated data budget'],[['Useful data',r.payload],['Padding',r.padding],['Layout span / stride',r.span]].map(([key,n])=>`<tr><th scope="row">${key}</th><td>${bytes(n)}</td><td>${bytes(n*count)}</td></tr>`));
  $('export').disabled=false;
  return true;
 }
 function inspect(offset){
  const r=active();if(!r)return;offset=Math.trunc(Math.max(0,Math.min(r.span-1,Number(offset)||0)));$('byte').value=offset;
  const s=r.segments.find(s=>offset>=s.offset&&offset<s.offset+s.size);
  if(s)$('detail').textContent=`Byte ${offset} · ${s.path} · ${s.type} · ${s.size}-byte component at offset ${s.offset}. Field ${s.root}.`;
  else{const gap=r.holes.find(g=>offset>=g.offset&&offset<g.offset+g.size);$('detail').textContent=`Byte ${offset} · padding · gap ${gap.offset}–${gap.offset+gap.size-1} (${bytes(gap.size)}). Alignment, array/matrix stride or final block rounding leaves these bytes unused.`;}
 }
 function draw(){
  const r=active();if(!r)return;const total=Math.ceil(r.span/16),pages=Math.ceil(total/16);page=Math.min(Math.max(0,page),pages-1);
  $('map').innerHTML=memoryDiagram(r,{startRow:page*16,selected:$('inspect-field').value,id:'layout-map'});
  $('page').textContent=`Rows ${page*16+1}–${Math.min(total,(page+1)*16)} of ${total} · ${page+1} / ${pages}`;$('prev').disabled=page===0;$('next').disabled=page===pages-1;
  $('byte').max=r.span-1;inspect($('byte').value);
  const used=occupancy(r.payload,r.span);let assessment='Field order has not been checked. Use Suggest field order to test whether the span can shrink.';
  if(suggestion)assessment=suggestion.saved?`Reordering can reduce the original span from ${bytes(original.span)} to ${bytes(suggestion.layout.span)} (${bytes(suggestion.saved)} saved).`:suggestion.method==='Exhaustive top-level search'?'No smaller span exists among permutations of these top-level fields. Padding may be required; nested layouts remain unchanged.':'No smaller span was found by the bounded search. A better order may still exist.';
  $('packing').className='notice'+(suggestion?.saved?' notice--warning':'');
  $('packing').hidden=false;
  $('packing').textContent=`${used.percent}% data · ${bytes(r.payload)} of ${bytes(r.span)} · ${bytes(r.padding)} padding in the displayed layout. ${assessment}`;
 }
 function render(){
  const r=active();if(!r)return;const validBudget=summary();
  const old=$('inspect-field').value;$('inspect-field').innerHTML='<option value="">All fields</option>'+r.rows.map((f,i)=>`<option value="${escape(f.name)}">${i+1} · ${escape(f.name)}</option>`).join('');if(r.rows.some(f=>f.name===old))$('inspect-field').value=old;
  $('offsets').innerHTML=table('FIELD OFFSETS / BYTES',['Field','Type','Offset','Data / extent','Align / stride'],r.rows.map((f,i)=>`<tr><th scope="row"><button class="button button--quiet" type="button" data-inspect="${i}">${i+1} · ${escape(f.name)}</button></th><td>${escape(f.type)}${f.array?'['+f.array+']':''}</td><td>${f.offset}</td><td>${f.payload} / ${f.size}</td><td>${f.alignment}${f.arrayStride!=null?' / array '+f.arrayStride:''}${f.matrixStride!=null?' / matrix '+f.matrixStride:''}<p class="control-hint">${escape(f.reason)}${f.paddingBefore?' · '+bytes(f.paddingBefore)+' before field.':''}</p></td></tr>`));
  $('export-code').textContent=(options().native16?'// Compile with DXC -enable-16bit-types and shader model 6.2+.\n':'')+formatDeclarations(suggestion&&$('view').value==='suggested'?suggestion.model:model,{...options(),explicitMatrixOrder:true});
  draw();
  return validBudget;
 }
 function calculate({syncFields=false}={}){
  clearTimeout(timer);try{const next=parseDeclarations(source.value),r=calculateLayout(next,options());model=next;original=r;invalidate();page=0;example();if(syncFields)fields();$('suggest').disabled=$('export').disabled=$('copy').disabled=false;if(render())tell(`${r.profile==='cbuffer'?'DXC legacy cbuffer':'DXC structured element'} · ${bytes(r.payload)} data + ${bytes(r.padding)} padding = ${bytes(r.span)} layout span. Changes update automatically.`);}catch(error){clearResults(error.message);}
 }
 controls.addEventListener('input',event=>{
  const input=event.target.closest('[data-key]'),row=input?.closest('[data-field]');if(!row)return;
  const field=model.fields[Number(row.dataset.field)],key=input.dataset.key;field[key]=key==='array'?(Number(input.value)===0?null:Number(input.value)):input.value;
  source.value=formatDeclarations(model,options());calculate();
 });
 controls.addEventListener('click',event=>{const button=event.target.closest('[data-action]'),row=button?.closest('[data-field]');if(!row)return;const i=Number(row.dataset.field),action=button.dataset.action;if(action==='remove')model.fields.splice(i,1);else{const j=i+(action==='up'?-1:1);[model.fields[i],model.fields[j]]=[model.fields[j],model.fields[i]];}source.value=formatDeclarations(model,options());calculate({syncFields:true});});
 $('add').onclick=()=>{let i=model.fields.length+1;while(model.fields.some(f=>f.name==='field'+i))i++;model.fields.push({name:'field'+i,type:'float',array:null,major:null});source.value=formatDeclarations(model,options());calculate({syncFields:true});};
 source.addEventListener('input',()=>{clearTimeout(timer);clearResults('Updating declarations…');tell('Updating declarations…');timer=setTimeout(()=>calculate({syncFields:true}),220);});
 for(const id of ['profile','major','native16'])$(id).addEventListener('change',()=>calculate());
 $('count').oninput=()=>{if(summary())tell('Repeated data budget updated. GPU resource-allocation alignment is outside this calculation.');};
 $('examples').onchange=()=>{clearTimeout(timer);const key=$('examples').value;if(key==='raymarch'){onExampleChange('raymarch',key);return;}selectedExample=key;if(key==='custom'){example();return;}source.value=MEMORY_PRESETS[key].source;calculate({syncFields:true});};
 $('calculate').onclick=()=>calculate({syncFields:true});
 $('suggest').onclick=()=>{
  if(!original)return;try{suggestion=suggestOrder(model,options());$('comparison').innerHTML=table(suggestion.method,['Order','Span','Padding'],[['Original',original],['Suggested',suggestion.layout]].map(([name,r])=>`<tr><th scope="row">${name}</th><td>${bytes(r.span)}</td><td>${bytes(r.padding)}</td></tr>`))+`<p class="control-hint">${bytes(suggestion.saved)} saved per block / element. ${escape(suggestion.method)}; ${suggestion.evaluated.toLocaleString()} orders checked. Nested structures and field types are unchanged. ${suggestion.saved?'Update the CPU-side writer and all consumers before using a reordered layout.':'No smaller arrangement was found; the original order is retained.'}</p>`;$('view').options[1].disabled=false;$('view').value='suggested';$('use').disabled=suggestion.saved===0;page=0;render();tell('Comparison ready. Original declarations are preserved until you apply the suggested order.');}catch(error){tell(error.message,true);}
 };
 $('use').onclick=()=>{if(!suggestion)return;source.value=formatDeclarations(suggestion.model,options());calculate({syncFields:true});};
 $('view').onchange=()=>{page=0;render();};$('inspect-field').onchange=draw;$('byte').oninput=()=>inspect($('byte').value);
 $('offsets').onclick=event=>{const button=event.target.closest('[data-inspect]');if(!button)return;const f=active().rows[Number(button.dataset.inspect)];$('inspect-field').value=f.name;page=Math.floor(f.offset/256);$('byte').value=f.offset;draw();};
 $('map').onclick=event=>{const cell=event.target.closest('[data-byte]');if(cell)inspect(Number(cell.dataset.byte));};
 $('prev').onclick=()=>{page--;draw();};$('next').onclick=()=>{page++;draw();};
 $('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('export-code').textContent);tell('Declarations copied.');}catch{tell('Clipboard unavailable. Select and copy the declarations below.');}};
 $('export').onclick=()=>{
  if(!active()||$('export').disabled)return;const count=Number($('count').value),preset=functionExample(),result={version:1,profile:options(),repetitions:count,scope:'Logical DXC buffer layout; excludes resource allocation, registers and execution costs.',preset:selectedExample,functionExample:preset?{call:preset.call,resultType:preset.resultType,reference:preset.reference,scope:'Only declared input fields are included in the layout. Function result and temporaries are excluded.'}:null,source:source.value,selectedOrder:$('view').value,declarations:$('export-code').textContent,layout:active(),repeatedSpan:active().span*count,suggestion:suggestion?{saved:suggestion.saved,method:suggestion.method,order:suggestion.order}:null};
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Shader_Memory_Layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);tell('JSON report downloaded.');
 };
 source.value=EXAMPLES.padding.source;calculate({syncFields:true});
 return {loadBuffer(declarations,field=''){
  selectedExample='custom';source.value=declarations;$('profile').value='cbuffer';$('native16').checked=false;calculate({syncFields:true});
  if(original&&original.rows.some(f=>f.name===field)){$('inspect-field').value=field;$('byte').value=original.rows.find(f=>f.name===field).offset;draw();}
 }};
}
