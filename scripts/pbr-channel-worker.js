import {LIMITS,decodePNG,encodePNG,pack,preview,validateConfig} from './pbr-channel-core.js';
let sources=new Map(),nextId=0,result=null,job=0;
const metadata=()=>[...sources.values()].map(({id,name,width,height,bytes,decoder,data})=>({id,name,width,height,bytes,decoder,thumbnail:preview(data,width,height,'rgb',48)}));
const reply=(id,data,transfer=[])=>postMessage({id,ok:true,...data},transfer);
async function decode(file){
 if(file.size>LIMITS.fileBytes)throw Error('Each input must be at most 64 MiB.');
 if(/\.png$/i.test(file.name)||file.type==='image/png')return{...await decodePNG(await file.arrayBuffer()),decoder:'PNG · raw 8-bit values'};
 if(file.type!=='image/jpeg'&&!/\.jpe?g$/i.test(file.name))throw Error('Import PNG or JPEG images.');
 const image=await createImageBitmap(file,{colorSpaceConversion:'none',premultiplyAlpha:'none'});try{if(image.width>LIMITS.sourceSide||image.height>LIMITS.sourceSide||image.width*image.height>LIMITS.pixels)throw Error('JPEG dimensions exceed the input limit.');const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);return{width:image.width,height:image.height,data:ctx.getImageData(0,0,image.width,image.height).data,decoder:'JPEG · browser decoded'};}finally{image.close();}
}
onmessage=async({data:message})=>{const {id,action}=message;if(action==='cancel'){job++;return;}try{
 if(action==='add'){
  const files=message.files;if(sources.size+files.length>LIMITS.files)throw Error('At most 16 source images.');const sum=[...sources.values()].reduce((a,s)=>({pixels:a.pixels+s.width*s.height,bytes:a.bytes+s.bytes}),{pixels:0,bytes:0}),pending=[];
  for(const file of files){sum.bytes+=file.size;if(sum.bytes>LIMITS.totalBytes)throw Error('Batch source files exceed 128 MiB.');let image;try{image=await decode(file);}catch(error){throw Error(file.name+': '+error.message);}sum.pixels+=image.width*image.height;if(sum.pixels>LIMITS.pixels)throw Error('Batch exceeds 64 million decoded pixels.');pending.push({...image,id:'source-'+(++nextId),name:file.name,bytes:file.size});}
  for(const item of pending)sources.set(item.id,item);result=null;reply(id,{sources:metadata()});
 }else if(action==='clear'){sources.clear();result=null;job++;reply(id,{sources:[]});}
 else if(action==='remove'){sources.delete(message.source);result=null;reply(id,{sources:metadata()});}
 else if(action==='pack'){const token=++job,config=message.config;const data=await pack(config,sources,{cancelled:()=>job!==token,progress:value=>postMessage({progress:value}),yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))});if(job!==token)throw Error('Cancelled.');result={data,config};const view=preview(data,config.width,config.height,message.view);reply(id,{preview:view,width:config.width,height:config.height,format:config.format},[view.data.buffer]);}
 else if(action==='draft'){const original=message.config;validateConfig(original,sources);const scale=Math.min(1,256/Math.max(original.width,original.height)),config={...original,width:Math.max(1,Math.round(original.width*scale)),height:Math.max(1,Math.round(original.height*scale))};const data=await pack(config,sources);const composite=preview(data,config.width,config.height,message.view,256),channels=['r','g','b','a'].map(view=>preview(data,config.width,config.height,view,96));reply(id,{preview:composite,channels},[composite.data.buffer,...channels.map(c=>c.data.buffer)]);}
 else if(action==='preview'){if(!result)throw Error('Generate the packed texture first.');const view=preview(result.data,result.config.width,result.config.height,message.view);reply(id,{preview:view},[view.data.buffer]);}
 else if(action==='export'){if(!result)throw Error('Generate the packed texture first.');reply(id,{blob:await encodePNG(result.data,result.config.width,result.config.height,result.config.format)});}
 else throw Error('Unknown operation.');
 }catch(error){postMessage({id,ok:false,error:error.message||'Processing failed.'});}};
