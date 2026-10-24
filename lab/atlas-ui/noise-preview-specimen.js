// A single fixed catalogue fixture, not another editable generator.
export async function renderNoisePreviewSpecimen(host){
 await import('/scripts/noise-generator-core.js?v=2');
 await import('/scripts/noise-material-preview.js?v=2');
 const core=window.NoiseGeneratorCore,size=256;
 const field=core.generate({...core.defaults,...core.presets.concrete,seed:42},size);
 const paint=(type,convention)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').putImageData(new ImageData(core.pixels(field,type,convention),size,size),0,0);return canvas;};
 const views=host.querySelectorAll('canvas');
 views[0].width=views[0].height=size;views[0].getContext('2d').drawImage(paint('normal','dx'),0,0);
 views[1].width=views[1].height=size;
 try{const material=window.NoiseMaterialPreview(views[1]);material.update(...['normal','roughness','albedo','specular'].map(type=>paint(type,'gl')));}
 catch{host.querySelectorAll('figcaption')[1].textContent='Material preview requires WebGL.';}
 host.dataset.previewReady='true';
}
