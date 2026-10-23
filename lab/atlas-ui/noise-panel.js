import {createControlDisclosure} from './control-disclosure.js?v=review-84';
export function setupNoisePanel(main){
 // Keep integration hooks available to the existing engine, outside the visible UI.
 const hooks=document.createElement('div');hooks.hidden=true;hooks.inert=true;
 for(const id of ['noise-copy','noise-cancel']){const button=main.querySelector(`#${id}`);if(button)hooks.append(button);}
 main.append(hooks);
 const host=main.querySelector('#noise-settings'),original=host.querySelector('.noise-controls');
 const groups=[['Surface',['mode','preset','seed','seamless']],['Noise & fractal',['noiseType','fractal','frequency','octaves','lacunarity','persistence']],['Detail & direction',['macro','micro','secondary','anisotropy','direction','smoothing']],['Normals',['strength','convention','invertX','invertY']]];
 const panel=document.createElement('div');panel.className='control-panel control-panel--columns';
 for(const [title,names]of groups){const group=document.createElement('fieldset');group.className='control-group control-group--stack';const legend=document.createElement('legend');legend.textContent=title;group.append(legend);for(const name of names){const input=host.querySelector(`[name="${name}"]`);if(input)group.append(input.closest('label'));}panel.append(group);}
 const details=createControlDisclosure('Surface settings');original.before(details);details.append(panel);original.remove();
 const maps=host.querySelector('.noise-map-settings');if(maps){const channels=createControlDisclosure('Albedo, roughness & specular',{open:false});while(maps.children.length>1)channels.append(maps.children[1]);maps.replaceWith(channels);details.append(channels);}
 // Original input nodes and data-noise-setting attributes are retained for the engine.
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
