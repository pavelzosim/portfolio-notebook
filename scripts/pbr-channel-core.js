export const LIMITS=Object.freeze({files:16,fileBytes:64*1024*1024,totalBytes:128*1024*1024,pixels:64*1024*1024,sourceSide:8192,outputSide:4096});
const clamp=x=>Math.max(0,Math.min(1,x));
export function dimensions(width,height,max=LIMITS.outputSide){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>max||height>max)throw Error(`Dimensions must be between 1 and ${max} pixels.`);}
export function roleFromName(name){const n=name.toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,' ');const roles=[['ao',/\bao\b|ambient ?occlusion|\bocclusion\b/],['roughness',/roughness|\brough\b/],['metallic',/metallic|metalness|\bmetal\b/],['smoothness',/smoothness|\bsmooth\b/],['detail',/detail/]].filter(([,re])=>re.test(n));return roles.length===1?roles[0][0]:null;}
export function presetChannels(preset,sources=[]){
 const find=role=>sources.find(s=>roleFromName(s.name)===role)?.id||'';
 const make=(role,value,invert=false)=>({source:role?find(role):'',input:'r',constant:value,invert,black:0,white:255,gamma:1});
 if(preset==='unreal')return [make('ao',255),make('roughness',128),make('metallic',0),make(null,255)];
 if(preset==='hdrp'||preset==='urp'){const smooth=find('smoothness');return[make('metallic',0),make('ao',255),make(preset==='hdrp'?'detail':null,0),smooth?{...make('smoothness',128),source:smooth}:make('roughness',128,true)];}
 return [make(null,0),make(null,0),make(null,0),make(null,255)];
}
export function transform(value,config){let x=clamp((value-config.black)/(config.white-config.black));x=Math.pow(x,1/config.gamma);return Math.round(255*(config.invert?1-x:x));}
export function validateConfig(config,sources){
 dimensions(config.width,config.height);
 if(!['rgb','rgba'].includes(config.format)||!['strict','stretch','contain','cover'].includes(config.resize)||!['nearest','bilinear'].includes(config.filter))throw Error('Invalid output settings.');
 if(config.channels?.length!==4)throw Error('Four channel settings are required.');
 for(const c of config.channels.slice(0,config.format==='rgb'?3:4)){if(!['r','g','b','a','luma'].includes(c.input)||!Number.isInteger(c.constant)||c.constant<0||c.constant>255||!Number.isFinite(c.black)||!Number.isFinite(c.white)||c.black<0||c.white>255||c.white<=c.black||!Number.isFinite(c.gamma)||c.gamma<0.1||c.gamma>10)throw Error('Channels require 0–255 values, white above black, and gamma 0.1–10.');const s=c.source?sources.get(c.source):null;if(c.source&&!s)throw Error('A selected source is missing.');if(s&&config.resize==='strict'&&Math.abs(s.width*config.height-s.height*config.width)>0)throw Error('Source and output aspect ratios differ. Select Contain, Cover or Stretch explicitly.');}
 if(['hdrp','urp'].includes(config.preset)&&config.format!=='rgba')throw Error('Unity presets require RGBA output for smoothness.');
}
function read(source,x,y,input){x=Math.max(0,Math.min(source.width-1,x));y=Math.max(0,Math.min(source.height-1,y));const i=(y*source.width+x)*4,d=source.data;return input==='luma'?0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]:d[i+({r:0,g:1,b:2,a:3}[input])];}
export function sample(source,x,y,width,height,config,mode,filter){
 let sx=(x+0.5)*source.width/width-0.5,sy=(y+0.5)*source.height/height-0.5;
 if(mode==='contain'||mode==='cover'){const scale=(mode==='contain'?Math.min:Math.max)(width/source.width,height/source.height),left=(width-source.width*scale)/2,top=(height-source.height*scale)/2;sx=(x+0.5-left)/scale-0.5;sy=(y+0.5-top)/scale-0.5;if(mode==='contain'&&(x+0.5<left||x+0.5>=width-left||y+0.5<top||y+0.5>=height-top))return config.constant;}
 if(filter==='nearest')return read(source,Math.round(sx),Math.round(sy),config.input);
 const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
 return (read(source,ix,iy,config.input)*(1-fx)+read(source,ix+1,iy,config.input)*fx)*(1-fy)+(read(source,ix,iy+1,config.input)*(1-fx)+read(source,ix+1,iy+1,config.input)*fx)*fy;
}
export async function pack(config,sources,{cancelled=()=>false,progress=()=>{},yieldControl=()=>Promise.resolve()}={}){
 validateConfig(config,sources);const {width,height,channels}=config,out=new Uint8Array(width*height*4),inputs=channels.map(c=>sources.get(c.source));
 for(let y=0;y<height;y++){if(y%16===0){if(cancelled())throw Error('Cancelled.');progress(y/height);await yieldControl();}for(let x=0;x<width;x++){const i=(y*width+x)*4;for(let k=0;k<4;k++)out[i+k]=config.format==='rgb'&&k===3?255:transform(inputs[k]?sample(inputs[k],x,y,width,height,channels[k],config.resize,config.filter):channels[k].constant,channels[k]);}}
 progress(1);return out;
}
export function preview(data,width,height,view='rgb',max=512){const scale=Math.min(1,max/width,max/height),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale)),out=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(Math.min(height-1,Math.floor(y/scale))*width+Math.min(width-1,Math.floor(x/scale)))*4,j=(y*w+x)*4;if(['r','g','b','a'].includes(view)){out[j]=out[j+1]=out[j+2]=data[i+({r:0,g:1,b:2,a:3}[view])];out[j+3]=255;}else{out.set(data.subarray(i,i+4),j);if(view==='rgb')out[j+3]=255;}}return{data:out,width:w,height:h};}

// PNG data path deliberately bypasses Canvas: RGB under zero alpha must survive.
const signature=Uint8Array.of(137,80,78,71,13,10,26,10),te=new TextEncoder(),td=new TextDecoder();
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const out=new Uint8Array(data.length+12),v=new DataView(out.buffer);v.setUint32(0,data.length);out.set(te.encode(type),4);out.set(data,8);v.setUint32(data.length+8,crc32(out.subarray(4,data.length+8)));return out;}
export async function encodePNG(data,width,height,format='rgba'){
 dimensions(width,height);if(data.length!==width*height*4||!['rgb','rgba'].includes(format))throw Error('Invalid PNG pixels.');
 const count=format==='rgb'?3:4,stride=width*count,rows=new Uint8Array((stride+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let k=0;k<count;k++)rows[y*(stride+1)+1+x*count+k]=data[(y*width+x)*4+k];
 const compressed=new Uint8Array(await new Response(new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()),ihdr=new Uint8Array(13),v=new DataView(ihdr.buffer);v.setUint32(0,width);v.setUint32(4,height);ihdr[8]=8;ihdr[9]=format==='rgb'?2:6;
 return new Blob([signature,chunk('IHDR',ihdr),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())],{type:'image/png'});
}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
export async function decodePNG(buffer){
 const bytes=new Uint8Array(buffer),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(!signature.every((b,i)=>bytes[i]===b))throw Error('Not a PNG file.');
 let width,height,type,bpp,palette,alpha,idat=[],end=false,header=false;
 for(let i=8;i<bytes.length;){if(i+12>bytes.length)throw Error('Truncated PNG.');const size=v.getUint32(i);if(size>LIMITS.fileBytes||i+size+12>bytes.length)throw Error('Invalid PNG chunk.');const name=td.decode(bytes.subarray(i+4,i+8)),data=bytes.subarray(i+8,i+8+size);if(crc32(bytes.subarray(i+4,i+8+size))!==v.getUint32(i+8+size))throw Error('PNG checksum mismatch.');if(!header&&name!=='IHDR')throw Error('PNG header is missing.');
  if(name==='IHDR'){if(header||size!==13)throw Error('Invalid PNG header.');width=v.getUint32(i+8);height=v.getUint32(i+12);dimensions(width,height,LIMITS.sourceSide);if(width*height>LIMITS.pixels)throw Error('Image exceeds the pixel limit.');type=data[9];bpp=({0:1,2:3,3:1,4:2,6:4})[type];if(data[8]!==8||!bpp||data[10]||data[11]||data[12])throw Error('Use an 8-bit, non-interlaced PNG (grayscale, RGB, RGBA or indexed).');header=true;}
  else if(name==='acTL')throw Error('Animated PNG is not supported. Export a single image.');else if(name==='PLTE')palette=data;else if(name==='tRNS')alpha=data;else if(name==='IDAT')idat.push(data);else if(name==='IEND'){end=true;break;}else if(name[0]===name[0].toUpperCase())throw Error('Unsupported critical PNG chunk: '+name);i+=size+12;
 }
 if(!end||!idat.length||(type===3&&(!palette||palette.length%3)))throw Error('Incomplete PNG.');
 const stride=width*bpp,expected=(stride+1)*height,stream=new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate')).getReader(),parts=[];let length=0;try{while(true){const {value,done}=await stream.read();if(done)break;length+=value.length;if(length>expected){await stream.cancel();throw Error('PNG decompressed size exceeds its dimensions.');}parts.push(value);}}finally{stream.releaseLock();}if(length!==expected)throw Error('PNG scanline size mismatch.');
 const raw=new Uint8Array(length);let offset=0;for(const p of parts){raw.set(p,offset);offset+=p.length;}const pixels=new Uint8Array(width*height*4);let prior=new Uint8Array(stride);
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Invalid PNG filter.');const row=raw.slice(y*(stride+1)+1,(y+1)*(stride+1));for(let x=0;x<stride;x++){const a=x>=bpp?row[x-bpp]:0,b=prior[x],c=x>=bpp?prior[x-bpp]:0;row[x]=(row[x]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}for(let x=0;x<width;x++){const j=(y*width+x)*4,k=x*bpp;if(type===0||type===4){pixels[j]=pixels[j+1]=pixels[j+2]=row[k];pixels[j+3]=type===4?row[k+1]:alpha&&alpha.length===2&&alpha[0]===0&&row[k]===alpha[1]?0:255;}else if(type===3){const n=row[k];if(n*3+2>=palette.length)throw Error('Invalid palette index.');pixels[j]=palette[n*3];pixels[j+1]=palette[n*3+1];pixels[j+2]=palette[n*3+2];pixels[j+3]=alpha&&n<alpha.length?alpha[n]:255;}else{pixels[j]=row[k];pixels[j+1]=row[k+1];pixels[j+2]=row[k+2];pixels[j+3]=type===6?row[k+3]:alpha&&alpha.length===6&&alpha[0]===0&&alpha[2]===0&&alpha[4]===0&&row[k]===alpha[1]&&row[k+1]===alpha[3]&&row[k+2]===alpha[5]?0:255;}}prior=row;}
 return{width,height,data:pixels};
}
