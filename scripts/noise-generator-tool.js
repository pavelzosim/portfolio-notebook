(()=>{
'use strict';
const $=id=>document.getElementById(id),core=NoiseGeneratorCore,scriptURL=document.currentScript.src;
const fields=[...document.querySelectorAll('[data-noise-setting]')];let worker,pending,timer,job=0,ready=false,busy=false,material;
try{material=NoiseMaterialPreview($('noise-material'));}catch(e){$('noise-material-note').textContent=e.message;}
const message=t=>$('noise-status').textContent=t;
function read(){const s={};for(const f of fields)s[f.name]=f.type==='checkbox'?f.checked:f.type==='number'||f.type==='range'?Number(f.value):f.value;return core.settings(s);}
function apply(s){for(const f of fields)if(s[f.name]!==undefined){if(f.type==='checkbox')f.checked=s[f.name];else f.value=s[f.name];}}
function buttons(){for(const id of ['noise-download','noise-batch'])$(id).disabled=busy||!ready;$('noise-cancel').disabled=!busy;}
function stop(){clearTimeout(timer);job++;if(worker)worker.terminate();worker=null;if(pending){pending.reject(new DOMException('Cancelled','AbortError'));pending=null;}busy=false;buttons();}
function assertCurrent(token){if(token!==job)throw new DOMException('Cancelled','AbortError');}
function request(data){return new Promise((resolve,reject)=>{pending={resolve,reject};worker.postMessage(data);});}
function spawn(){worker=new Worker(new URL('noise-generator-worker.js?v=2',scriptURL));worker.onmessage=({data})=>{if(data.type==='progress'){$('noise-progress').value=data.value;return;}if(!pending)return;const p=pending;pending=null;data.type==='error'?p.reject(Error(data.message)):p.resolve(data);};worker.onerror=e=>{if(pending){pending.reject(Error(e.message||'Generation worker failed.'));pending=null;}};}
function paint(data,canvas){const source=document.createElement('canvas');source.width=source.height=data.size;source.getContext('2d').putImageData(new ImageData(data.rgba,data.size,data.size),0,0);if(canvas){canvas.width=canvas.height=Math.min(512,data.size);canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);}return source;}
function lighting(){material?.draw({shape:$('noise-shape').value,azimuth:Number($('noise-light-angle').value),elevation:Number($('noise-light-height').value),repeats:Number($('noise-repeats').value),colored:$('noise-material-color').value==='albedo'});}
async function preview(){
 stop();ready=false;buttons();
 if(!$('noise-form').reportValidity()){message('Check the highlighted parameters, then generate again.');return;}
 const token=job,s=read();busy=true;buttons();$('noise-progress').hidden=false;$('noise-progress').value=0;message('Generating 512 × 512 preview…');spawn();
 try{
  await request({action:'generate',settings:s,size:512});assertCurrent(token);
  const tex=await request({action:'map',map:s.mode,convention:s.convention});paint(tex,$('noise-texture'));
  const captions={height:'Height · linear grayscale',normal:`Tangent normal · ${s.convention==='dx'?'DirectX −Y':'OpenGL +Y'}`,albedo:'Albedo · sRGB color / no lighting',specular:'Specular · linear dielectric F0',roughness:'Roughness · linear grayscale'};
  $('noise-texture-caption').textContent=captions[s.mode];
  if(material){const maps=[];try{for(const map of ['normal','roughness','albedo','specular'])maps.push(paint(await request({action:'map',map,convention:'gl'})));assertCurrent(token);material.update(...maps);}finally{maps.forEach(c=>c.width=1);}lighting();}
  assertCurrent(token);ready=true;message('Ready · 512 px preview. Export renders the selected resolution from the same settings.');
 }catch(e){if(e.name!=='AbortError'&&token===job)message(e.message);}
 finally{if(token===job){busy=false;buttons();$('noise-progress').hidden=true;}}
}
function save(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const blobOf=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG encoding failed. Try a lower resolution.')),'image/png'));
async function exportMaps(batch){
 if(busy||!ready)return;
 const s=read(),n=Number($('noise-resolution').value),selected=$('noise-export-map').value;
 stop();const token=job;busy=true;buttons();$('noise-settings').disabled=true;$('noise-progress').hidden=false;$('noise-progress').value=0;spawn();
 try{
  message(`Rendering ${n} × ${n}… 4K may take a while; Cancel stops the export.`);
  await request({action:'generate',settings:s,size:n});assertCurrent(token);
  const maps=batch?[['height',''],['normal','dx'],['normal','gl'],['roughness',''],['albedo',''],['specular','']]:[[selected,selected==='normal'?s.convention:'']];
  const files=[];
  for(const [map,convention] of maps){
   message(`Encoding ${map}${convention?' '+convention.toUpperCase():''} · ${n} px…`);
   const data=await request({action:'map',map,convention:convention||s.convention});assertCurrent(token);
   const canvas=paint(data);let blob;
   try{blob=await blobOf(canvas);}finally{canvas.width=1;}
   assertCurrent(token);
   const suffix=map==='normal'?'Normal_'+convention.toUpperCase():map[0].toUpperCase()+map.slice(1);
   files.push({name:`${s.preset}_${s.noiseType}_${s.fractal}_${suffix}_${n}px_seed${s.seed}.png`,blob});
  }
  if(batch){
   files.push({name:'noise-settings.json',blob:new Blob([JSON.stringify({version:2,resolution:n,colorSpaces:{albedo:'sRGB',height:'linear',normal:'linear',roughness:'linear',specular:'linear dielectric F0'},...s},null,2)],{type:'application/json'})});
   const zip=await ImageCompressorCore.zip(files);assertCurrent(token);
   save(zip,`${s.preset}_${n}px_seed${s.seed}.zip`);
  }else{assertCurrent(token);save(files[0].blob,files[0].name);}
  message('Export complete. All maps use the same seed, coordinates and layer settings.');
 }catch(e){if(e.name!=='AbortError'&&token===job)message(e.message);}
 finally{if(token===job){busy=false;$('noise-settings').disabled=false;$('noise-progress').hidden=true;buttons();}}
}
$('noise-form').addEventListener('submit',e=>{e.preventDefault();preview();});
for(const f of fields)f.addEventListener('change',()=>{if(f.name==='preset'){const current=read();apply({...current,...core.presets[f.value],preset:f.value});}if(f.name==='mode')$('noise-export-map').value=f.value;stop();ready=false;buttons();message('Settings changed. Updating preview…');timer=setTimeout(preview,250);});
$('noise-random').onclick=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);document.querySelector('[name=seed]').value=a[0];preview();};
$('noise-copy').onclick=async()=>{const text=JSON.stringify({version:2,...read()},null,2);try{await navigator.clipboard.writeText(text);message('Settings copied as JSON.');}catch{save(new Blob([text],{type:'application/json'}),'noise-settings.json');message('Settings saved as JSON.');}};
$('noise-cancel').onclick=()=>{stop();$('noise-settings').disabled=false;ready=false;buttons();$('noise-progress').hidden=true;message('Cancelled. Generate a preview to continue.');};
$('noise-download').onclick=()=>exportMaps(false);$('noise-batch').onclick=()=>exportMaps(true);
for(const id of ['noise-shape','noise-light-angle','noise-light-height','noise-repeats','noise-material-color'])$(id).addEventListener('input',lighting);
let dragging=false;$('noise-material').addEventListener('pointerdown',e=>{dragging=true;e.currentTarget.setPointerCapture(e.pointerId);});$('noise-material').addEventListener('pointerup',()=>dragging=false);$('noise-material').addEventListener('pointercancel',()=>dragging=false);$('noise-material').addEventListener('pointermove',e=>{if(!dragging)return;const r=e.currentTarget.getBoundingClientRect();$('noise-light-angle').value=(e.clientX-r.left)/r.width*360-180;$('noise-light-height').value=85-(e.clientY-r.top)/r.height*75;lighting();});
apply(core.defaults);preview();
})();
