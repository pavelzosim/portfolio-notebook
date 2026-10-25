import {createControlDisclosure} from './control-disclosure.js?v=review-84';
export function setupNoisePanel(main){
 // Imported controls keep their engine bindings, but use the catalogue faces.
 main.querySelectorAll('.noise-toggle').forEach(label=>{label.classList.remove('noise-toggle');label.classList.add('control-check');const caption=document.createElement('span');for(const node of [...label.childNodes])if(node.nodeType===Node.TEXT_NODE)caption.append(node);label.append(caption);});
 main.querySelectorAll('input[type="range"]').forEach(input=>{input.classList.remove('atlas-sp-slider');const wrap=input.parentElement;if(wrap.classList.contains('atlas-sp-slider-wrap'))wrap.className='range-scale';else{const scale=document.createElement('span');scale.className='range-scale';input.before(scale);scale.append(input);}});
 // Keep integration hooks available to the existing engine, outside the visible UI.
 const hooks=document.createElement('div');hooks.hidden=true;hooks.inert=true;
 for(const id of ['noise-copy','noise-cancel']){const button=main.querySelector(`#${id}`);if(button)hooks.append(button);}
 main.append(hooks);
 const host=main.querySelector('#noise-settings'),original=host.querySelector('.noise-controls');
 const groups=[['Surface',['mode','preset','seed','seamless']],['Noise & fractal',['noiseType','fractal','frequency','octaves','lacunarity','persistence']],['Detail & direction',['macro','micro','secondary','anisotropy','direction','smoothing']],['Normals',['strength','convention','invertX','invertY']]];
 const panel=document.createElement('div');panel.className='control-panel control-panel--columns';
 for(const [title,names]of groups){const group=document.createElement('fieldset');group.className='control-group control-group--stack';const legend=document.createElement('legend');legend.textContent=title;group.append(legend);for(const name of names){const input=host.querySelector(`[name="${name}"]`);if(input)group.append(input.closest('label'));}panel.append(group);}
 const details=createControlDisclosure('Surface settings');original.before(details);details.append(panel);original.remove();
 const normals=panel.lastElementChild;normals.classList.remove('control-group--stack');normals.classList.add('control-group--wide');
 const maps=host.querySelector('.noise-map-settings');if(maps){const channels=createControlDisclosure('Albedo, roughness & specular',{open:false});while(maps.children.length>1)channels.append(maps.children[1]);maps.replaceWith(channels);details.append(channels);}
 // Original input nodes and data-noise-setting attributes are retained for the engine.
 const hints={mode:'Choose the generated texture channel.',preset:'Apply a starting surface configuration.',seed:'The same seed and settings reproduce the same texture.',seamless:'Generate a tileable texture.',noiseType:'Choose the base noise algorithm.',fractal:'Combine noise octaves as fBm, ridged or billow noise.',frequency:'Base pattern frequency.',octaves:'Number of detail layers.',lacunarity:'Frequency multiplier between octaves.',persistence:'Amplitude multiplier between octaves.',macro:'Controls the broad surface shape.',micro:'Adds fine surface detail.',secondary:'Enable the independent micro-detail layer.',anisotropy:'Stretch the pattern along the selected direction.',direction:'Orientation of the stretched pattern in degrees.',smoothing:'Smooth the height before deriving normals.',strength:'Change normal intensity without changing height.',convention:'Choose DirectX or OpenGL to match your engine.',invertX:'Invert the normal X channel.',invertY:'Invert the normal Y channel.',colorLow:'Albedo colour for low height values.',colorHigh:'Albedo colour for high height values.',colorContrast:'Contrast of the albedo blend.',roughnessLow:'Roughness at low height values.',roughnessHigh:'Roughness at high height values.',specularLow:'Dielectric F0 reflectance at low height values.',specularHigh:'Dielectric F0 reflectance at high height values.'};
 const previewHints={'noise-material-color':'Use generated albedo or a neutral colour to inspect normals.','noise-shape':'Inspect the texture on a sphere or tiled plane.','noise-light-angle':'Rotate the preview light horizontally.','noise-light-height':'Change the preview light elevation.','noise-repeats':'Number of texture tiles on the preview.','noise-resolution':'Output dimensions. Full resolution is generated at export; 4K takes more memory and time.','noise-export-map':'Choose one texture map to export.','noise-generate':'Generate a 512 px preview with the current settings.','noise-random':'Choose a new seed.','noise-download':'Export the selected map as an 8-bit PNG.','noise-batch':'Download Height, Normal DX, Normal GL, Roughness, Albedo, Specular and settings JSON as ZIP.'};
 main.querySelectorAll('input,select,button').forEach(control=>{const text=hints[control.name]||previewHints[control.id];if(!text)return;control.title=text;const description=document.createElement('span');description.hidden=true;description.id='hint-'+(control.id||control.name);description.textContent=text;control.setAttribute('aria-describedby',description.id);control.after(description);});
 main.querySelectorAll('.tool-section').forEach(section=>{if(section.querySelector('h2')?.textContent.trim()==='How it works')section.remove();});
 main.querySelectorAll('.noise-note').forEach(note=>{if(note.textContent.startsWith('Macro controls')||note.textContent.startsWith('ZIP includes'))note.remove();});
}
export function setupNoisePresets(core,main){
 const common={...core.defaults};
 const presets={
  leaks:{...common,noiseType:'perlin',fractal:'ridged',frequency:8,octaves:4,macro:.55,micro:.15,anisotropy:.94,direction:90,smoothing:.7,strength:1.1},
  concrete:{...common,...core.presets.concrete},
  pores:{...common,...core.presets.pores,noiseType:'worley',fractal:'fbm'},
  spots:{...common,noiseType:'worley',fractal:'billow',frequency:6,octaves:2,macro:.15,micro:.05,anisotropy:0,smoothing:1,strength:.8},
  scratches:{...common,...core.presets.scratches,fractal:'ridged'}
 };
 for(const key of Object.keys(core.presets))delete core.presets[key];
 for(const [key,settings]of Object.entries(presets))core.presets[key]={...settings,preset:key};
 const select=main.querySelector('[name="preset"]');
 select.replaceChildren(...Object.keys(presets).map(key=>new Option(key[0].toUpperCase()+key.slice(1),key)));
 select.value='concrete';
}
