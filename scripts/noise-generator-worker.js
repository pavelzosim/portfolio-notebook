importScripts('noise-generator-core.js?v=2');
let field;
self.onmessage=({data})=>{try{if(data.action==='generate'){field=NoiseGeneratorCore.generate(data.settings,data.size,p=>postMessage({type:'progress',value:p}));postMessage({type:'ready',size:field.n});}else if(data.action==='map'){if(!field)throw Error('Generate a surface first.');const rgba=NoiseGeneratorCore.pixels(field,data.map,data.convention);postMessage({type:'map',rgba,size:field.n,map:data.map,convention:data.convention},[rgba.buffer]);}}catch(e){postMessage({type:'error',message:e.message});}};
