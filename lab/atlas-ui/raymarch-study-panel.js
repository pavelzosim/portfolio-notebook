import {studySettings,parameters,evaluatePixel,parameterBytes,BUFFER_DECLARATIONS,STAGES,HLSL_PARTS,FULL_HLSL} from '../../scripts/raymarch-study-core.js';
import {parseDeclarations,calculateLayout} from '../../scripts/shader-memory-core.js';
import {memoryDiagram} from './memory-layout-view.js?v=review-197';
import {renderMediaTabs,setupMediaTabs} from './media-tabs.js?v=review-198';
import {raymarchPipeline} from './raymarch-study-view.js?v=review-199';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Array.isArray(v)?'('+v.map(fmt).join(', ')+')':typeof v==='number'?Number(v.toPrecision(7)).toString():String(v);
const table=(title,heads,rows)=>`<div class="atlas-table-frame atlas-table-frame--solid"><div class="atlas-table-header-solid">[ ${safe(title)} ]</div><div class="atlas-table-body"><table class="atlas-table"><thead><tr>${heads.map(s=>'<th scope="col">'+safe(s)+'</th>').join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
export function setupRaymarchStudy(root,{openBuffer}){
 const $=id=>root.querySelector('#ray-'+id),form=$('settings'),image=$('image'),slice=$('slice'),imageCtx=image.getContext('2d'),sliceCtx=slice.getContext('2d');
 const layout=calculateLayout(parseDeclarations(BUFFER_DECLARATIONS));let config=studySettings(),pixel=[96,96],trace=null,sample=0,stage='march',selectedValue='d',selectedField='cameraPosition',frame=null,worker=null,busy=false,pending=null,serial=0,timer=null,started=false;
 const detail=$('detail-tabs');detail.innerHTML=renderMediaTabs([{id:'ray-values-panel',title:'Values & lifetimes',html:''},{id:'ray-code-panel',title:'HLSL function',html:''},{id:'ray-buffer-panel',title:'Parameter buffer',html:''}],safe,{label:'Selected stage details'});
 for(const [id,panel]of [['values','values'],['code','code'],['buffer','buffer']])detail.querySelector('#ray-'+panel+'-panel').append($(id));setupMediaTabs(detail);
 const tab=id=>root.querySelector('#tab-ray-'+id+'-panel').click();
 const tell=(text,error=false)=>{$('status').textContent=text;$('status').setAttribute('role',error?'alert':'status');};
 $('full-source').textContent=FULL_HLSL;
 function readConfig(){const c={};for(const input of form.elements){if(!input.name)continue;if(input.name==='frame'){[c.width,c.height]=input.value.split('x').map(Number);}else{if(input.value==='')throw Error('Complete '+input.name+'.');c[input.name]=Number(input.value);}}return studySettings(c);}
 function clear(){trace=null;frame=null;root.dataset.ready='false';imageCtx?.clearRect(0,0,image.width,image.height);sliceCtx?.clearRect(0,0,slice.width,slice.height);for(const id of ['result','stage-info','values','code-body','buffer-map','buffer-values','step'])$(id).replaceChildren();$('prev').disabled=$('next').disabled=$('step').disabled=$('open-buffer').disabled=true;}
 function drawImage(){if(!frame)return;imageCtx.putImageData(frame,0,0);const [x,y]=pixel;imageCtx.strokeStyle='#fff';imageCtx.lineWidth=3;imageCtx.strokeRect(x-3.5,y-3.5,8,8);imageCtx.strokeStyle='#000';imageCtx.lineWidth=1;imageCtx.strokeRect(x-3.5,y-3.5,8,8);}
 function drawSlice(){
  if(!trace)return;const ctx=sliceCtx,w=slice.width,h=slice.height,css=getComputedStyle(root),color=name=>css.getPropertyValue(name).trim();ctx.fillStyle=color('--surface');ctx.fillRect(0,0,w,h);ctx.font='12px '+css.fontFamily;
  const points=trace.steps.slice(0,sample+1).map(s=>[Math.hypot(s.point[0],s.point[1]),s.point[2]]),r=config.radius,far=Math.min(config.maxDistance,(config.cameraDistance+r)/Math.max(.001,-trace.ray.direction[2])),end=[Math.hypot(trace.ray.direction[0],trace.ray.direction[1])*far,config.cameraDistance+trace.ray.direction[2]*far];
  const xs=[-r,r,0,end[0],...points.map(p=>p[0])],zs=[-r,r,config.cameraDistance,end[1],...points.map(p=>p[1])],loX=Math.min(...xs)-.4,hiX=Math.max(...xs)+.4,loZ=Math.min(...zs)-.4,hiZ=Math.max(...zs)+.4;
  const s=Math.min((w-60)/(hiX-loX),(h-60)/(hiZ-loZ)),map=p=>[w/2+(p[0]-(loX+hiX)/2)*s,h/2-(p[1]-(loZ+hiZ)/2)*s];
  const center=map([0,0]);ctx.fillStyle=color('--note-success');ctx.beginPath();ctx.arc(...center,r*s,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color('--line');ctx.stroke();ctx.fillStyle=color('--ink');ctx.fillText('SDF sphere',center[0]-34,center[1]);
  const origin=map([0,config.cameraDistance]);ctx.fillText('camera',origin[0]+8,origin[1]);ctx.fillRect(origin[0]-3,origin[1]-3,6,6);
  ctx.strokeStyle=color('--strong');ctx.beginPath();ctx.moveTo(...origin);ctx.lineTo(...map(end));ctx.stroke();
  ctx.strokeStyle=color('--blue');ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...origin);for(const p of points)ctx.lineTo(...map(p));ctx.stroke();
  points.forEach((p,i)=>{const q=map(p);ctx.fillStyle=i===sample?color('--blue'):color('--ink');ctx.beginPath();ctx.arc(...q,i===sample?5:3,0,Math.PI*2);ctx.fill();});
  const current=trace.steps[sample];if(current){ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=color('--blue');ctx.beginPath();ctx.arc(...map(points.at(-1)),Math.max(0,current.distance)*s,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.fillStyle=color('--ink');ctx.fillText('sample '+(sample+1)+' · d = '+fmt(current.distance),16,h-18);}
 }
 function buffer(){
  const params=parameters(config),data=parameterBytes(config,layout);$('buffer-map').innerHTML=memoryDiagram(layout,{selected:selectedField,id:'ray-parameter-map'});
  $('buffer-values').innerHTML=table('PARAMETER VALUES / LITTLE-ENDIAN BYTES',['Field / offset','Typed value','Bytes'],layout.rows.map(f=>`<tr><th scope="row"><button type="button" class="button button--quiet" data-ray-param="${safe(f.name)}">${safe(f.name)} · ${f.offset}</button></th><td>${safe(fmt(params[f.name]))}</td><td>${Array.from(data.slice(f.offset,f.offset+f.payload),b=>b.toString(16).padStart(2,'0')).join(' ')}</td></tr>`));
 }
 function values(){
  if(!trace)return;const p=parameters(config),s=trace.steps[sample],row=(name,value,life,key=name)=>`<tr><th scope="row"><button type="button" class="button button--quiet" data-ray-value="${safe(key)}">${safe(name)}</button></th><td>${safe(fmt(value))}</td><td>${safe(life)}</td></tr>`;let rows=[];
  if(stage==='source')rows=layout.rows.map(f=>`<tr><th scope="row"><button type="button" class="button button--quiet" data-ray-param="${f.name}">${f.name}</button></th><td>${safe(fmt(p[f.name]))}</td><td>Uniform input · b0 + ${f.offset} · ${f.type}</td></tr>`);
  if(stage==='vertex')rows=[[0,[-1,1,0,1]],[1,[3,1,0,1]],[2,[-1,-3,0,1]]].map(([id,v])=>row('SV_VertexID '+id,v,'Clip-space position · VS invocation '+id,'vertexID'));
  if(stage==='ray')rows=[row('SV_Position.xy',trace.ray.position,'Pixel center; supplied by reference rasterizer','pixelCenter'),row('uv',trace.ray.uv,'Computed once for this pixel'),row('rd',trace.ray.direction,'Ray direction · reused across march and sky shading')];
  if(stage==='march'||stage==='sdf')rows=[row('sample',sample+1,'Selected SDF evaluation · '+s.action,'i'),row('t',s.t,'Loop-carried distance before this sample'),row('p',s.point,'Recomputed each iteration · float3 temporary'),row('d',s.distance,'Current SceneSDF return · float temporary'),row('Hit test',fmt(s.distance)+' < '+fmt(config.epsilon)+' → '+(s.distance<config.epsilon?'hit':'continue'),'Float32 comparison for this sample','hitTest'),row('next t',s.nextT,'Hit keeps t; advance adds d','nextT')];
  if(stage==='normal')rows=trace.hit?[row('hit position',trace.point,'Terminal hit, independent of selected march sample','p'),row('gradient',trace.surface.gradient,'Six central-difference SDF samples'),row('normal',trace.surface.normal,'Normalized gradient; used by shading','n')]:[row('normal','Skipped','No surface hit for this pixel','skipped')];
  if(stage==='shade')rows=[row('branch',trace.hit?'surface':'sky','Chosen after raymarch termination'),row('diffuse',trace.diffuse,trace.hit?'saturate(dot(n, light))':'Not evaluated on the sky branch'),row('linearColor',trace.linear,'Linear RGB before exposure and tone mapping')];
  if(stage==='output')rows=[row('linearColor',trace.linear,'From Shade'),row('exposed',trace.exposed,'linearColor × exposure'),row('mapped',trace.mapped,'Reinhard · exposed / (1 + exposed)'),row('encoded',trace.encoded,'Explicit sRGB transfer function'),row('RGBA8',trace.rgba,'Quantized UNORM bytes · alpha 255','return')];
  $('values').innerHTML=table('SELECTED STAGE / FLOAT32 MODEL VALUES',['Value','Current value','Lifetime / source'],rows);
 }
 function code(){
  const body=HLSL_PARTS[stage],needles={source:selectedField,vertex:'float2 uv',ray:selectedValue==='uv'?'float2 uv':'return normalize',march:selectedValue==='p'?'float3 p =':selectedValue==='hitTest'?'if (d < hitEpsilon)':selectedValue==='t'||selectedValue==='nextT'?'t += d':selectedValue==='i'?'[loop]':'float d',sdf:'return length',normal:'return normalize',shade:!trace?.hit?'return lerp':selectedValue==='linearColor'?'return baseColor':'float diffuse',output:selectedValue==='linearColor'||selectedValue==='exposed'?'float3 exposed':selectedValue==='mapped'?'float3 mapped':'return float3'};
  const skipped=stage==='normal'&&!trace?.hit;
  $('code-body').innerHTML=body.split('\n').map((line,i)=>{const current=!skipped&&line.includes(needles[stage]);return `<span${current?' class="token keyword" data-current-line="true"':''}>${current?'→ ':'  '}${String(i+1).padStart(2,' ')}  ${safe(line)}</span>`;}).join('\n');
  $('code-caption').textContent=(skipped?'Not executed for this pixel. ':'')+'Reference function · arrow links the selected value to source; it is not a GPU instruction pointer.';
 }
 function details(){if(!trace)return;const entry=STAGES.find(s=>s.id===stage);$('stage-info').textContent=entry.description;$('flow').innerHTML=raymarchPipeline(stage,trace.hit);values();code();drawSlice();}
 function selectPixel(){
  pixel=[Number($('x').value),Number($('y').value)];try{trace=evaluatePixel(config,...pixel);sample=Math.min(sample,trace.steps.length-1);$('step').innerHTML=trace.steps.map(s=>`<option value="${s.index}">${s.index+1} / ${trace.samples} · d ${fmt(s.distance)} · ${s.action}</option>`).join('');$('step').value=sample;$('prev').disabled=sample===0;$('next').disabled=sample===trace.steps.length-1;
   const hex='#'+trace.rgba.slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');$('result').textContent=`Pixel (${pixel.join(', ')}) · ${trace.reason} · ${trace.samples} march SDF calls + ${trace.hit?6:0} normal calls = ${trace.sdfCalls} · final RGB ${hex}.`;$('image-caption').textContent=`${config.width} × ${config.height} · Float32 prediction · RGBA8 ${trace.rgba.join(', ')}`;$('step').disabled=false;details();drawImage();
  }catch(error){trace=null;$('result').textContent=error.message;$('values').replaceChildren();$('code-body').replaceChildren();$('step').disabled=true;}
 }
 function finish(data){
  busy=false;if(data.id===serial){if(!data.ok){tell(data.error,true);clear();}else{frame=new ImageData(new Uint8ClampedArray(data.data),data.width,data.height);drawImage();root.dataset.ready='true';image.setAttribute('aria-busy','false');tell('Prediction ready. Pick a pixel and change inputs to see how its path and color respond.');}}
  if(pending){const job=pending;pending=null;send(job);}
 }
 function send(job){busy=true;worker.postMessage(job);}
 function update(){
  clearTimeout(timer);let next;try{if(!form.checkValidity())throw Error('Complete the settings with values inside their displayed bounds.');next=readConfig();}catch(error){serial++;pending=null;clear();tell(error.message,true);return;}
  config=next;pixel=[Math.min(Math.max(0,Number.isInteger(pixel[0])?pixel[0]:0),config.width-1),Math.min(Math.max(0,Number.isInteger(pixel[1])?pixel[1]:0),config.height-1)];for(const [i,id]of ['x','y'].entries()){$(id).max=(i?config.height:config.width)-1;$(id).value=pixel[i];}
  frame=null;image.width=config.width;image.height=config.height;image.setAttribute('aria-busy','true');root.dataset.ready='false';$('open-buffer').disabled=false;buffer();selectPixel();tell('Calculating the float32 prediction…');
  const job={id:++serial,settings:config};if(busy)pending=job;else send(job);
 }
 function activate(){if(started||root.hidden)return;started=true;if(!imageCtx||!sliceCtx){tell('Canvas 2D is unavailable.',true);return;}worker=new Worker(new URL('../../scripts/raymarch-study-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>finish(data);worker.onerror=()=>{busy=false;pending=null;clear();tell('The reference worker failed. Reload this page to retry.',true);};update();}
 new MutationObserver(activate).observe(root,{attributes:true,attributeFilter:['hidden']});activate();
 form.onsubmit=e=>e.preventDefault();form.oninput=()=>{clearTimeout(timer);serial++;clear();image.setAttribute('aria-busy','true');timer=setTimeout(update,180);};
 $('x').onchange=$('y').onchange=selectPixel;
 image.onclick=e=>{if(!frame)return;const r=image.getBoundingClientRect(),scale=Math.min(r.width/config.width,r.height/config.height),x=(e.clientX-r.left-(r.width-config.width*scale)/2)/scale,y=(e.clientY-r.top-(r.height-config.height*scale)/2)/scale;if(x<0||y<0||x>=config.width||y>=config.height)return;$('x').value=Math.floor(x);$('y').value=Math.floor(y);selectPixel();};
 image.onkeydown=e=>{if(!frame)return;const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.key==='Home'){pixel=[Math.floor(config.width/2),Math.floor(config.height/2)];}else if(moves[e.key])pixel=pixel.map((n,i)=>Math.max(0,Math.min((i?config.height:config.width)-1,n+moves[e.key][i])));else return;e.preventDefault();$('x').value=pixel[0];$('y').value=pixel[1];selectPixel();};
 function step(i){if(!trace)return;sample=i;$('step').value=i;$('prev').disabled=i===0;$('next').disabled=i===trace.steps.length-1;stage='march';details();}
 $('step').onchange=()=>step(Number($('step').value));$('prev').onclick=()=>step(Math.max(0,sample-1));$('next').onclick=()=>step(Math.min(trace.steps.length-1,sample+1));
 function chooseStage(target){if(!trace)return;stage=target.dataset.rayStage;selectedValue='';details();tab('values');}
 $('flow').onclick=e=>{const node=e.target.closest('[data-ray-stage]');if(node)chooseStage(node);};$('flow').onkeydown=e=>{const node=e.target.closest('[data-ray-stage]');if(node&&['Enter',' '].includes(e.key)){e.preventDefault();const id=node.dataset.rayStage;chooseStage(node);$('flow').querySelector(`[data-ray-stage="${id}"]`).focus();}};
 root.addEventListener('click',e=>{const parameter=e.target.closest('[data-ray-param]'),value=e.target.closest('[data-ray-value]');if(parameter){selectedField=parameter.dataset.rayParam;stage='source';details();buffer();tab('buffer');}else if(value){selectedValue=value.dataset.rayValue;code();tab('code');}});
 $('open-buffer').onclick=()=>openBuffer(BUFFER_DECLARATIONS,selectedField);
 window.addEventListener('pagehide',()=>worker?.terminate(),{once:true});
}
