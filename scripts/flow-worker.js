import {validate,prepare,vector,pixel} from './flow-core.js';
import {encodePNG} from './pbr-channel-core.js';
onmessage=async({data:p})=>{try{validate(p);const n=p.export.size,cache=prepare(p),rgba=new Uint8Array(n*n*4);for(let y=0;y<n;y++){for(let x=0;x<n;x++)rgba.set(pixel(vector(p,x/(n-1),y/(n-1),cache),p.export),(y*n+x)*4);if(y%128===0)postMessage({progress:y/n});}const blob=await encodePNG(rgba,n,n,p.export.format);postMessage({blob});}catch(e){postMessage({error:e.message});}};
