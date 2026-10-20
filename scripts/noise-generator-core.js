(function(root){
'use strict';
const defaults={preset:'concrete',mode:'normal',noiseType:'perlin',fractal:'fbm',seed:42,frequency:12,octaves:5,lacunarity:2,persistence:.5,strength:1.5,micro:.35,macro:.4,anisotropy:0,direction:0,smoothing:.5,secondary:true,seamless:true,invertX:false,invertY:false,convention:'dx',colorLow:'#34322e',colorHigh:'#b7ada0',colorContrast:1,specularLow:.025,specularHigh:.06,roughnessLow:.4,roughnessHigh:.85};
const presets={
 concrete:{frequency:12,octaves:5,micro:.35,macro:.4,anisotropy:0,direction:0,smoothing:.5,strength:1.5},
 suede:{frequency:24,octaves:4,micro:.65,macro:.15,anisotropy:.35,direction:20,smoothing:.3,strength:.7},
 pores:{frequency:18,octaves:3,micro:.5,macro:.2,anisotropy:0,direction:0,smoothing:.6,strength:1.2},
 scratches:{frequency:14,octaves:4,micro:.2,macro:.15,anisotropy:.94,direction:25,smoothing:.4,strength:1.1},
 fibers:{frequency:18,octaves:5,micro:.35,macro:.25,anisotropy:.85,direction:90,smoothing:.5,strength:.8}
};
function settings(input={}){
 const s={...defaults,...input};
 const ranges={seed:[0,4294967295],frequency:[1,64],octaves:[1,8],lacunarity:[1,3],persistence:[0,1],strength:[0,5],micro:[0,1],macro:[0,1],anisotropy:[0,.98],direction:[0,360],smoothing:[0,4],colorContrast:[.1,4],specularLow:[0,.16],specularHigh:[0,.16],roughnessLow:[0,1],roughnessHigh:[0,1]};
 for(const [k,[lo,hi]] of Object.entries(ranges)){if(!Number.isFinite(Number(s[k])))throw Error('Invalid '+k);s[k]=Math.max(lo,Math.min(hi,Number(s[k])));}
 s.seed=s.seed>>>0;s.octaves=Math.round(s.octaves);
 for(const k of ['secondary','seamless','invertX','invertY'])s[k]=!!s[k];
 if(!presets[s.preset])s.preset='concrete';
 if(!['height','normal','albedo','specular','roughness'].includes(s.mode))s.mode='normal';
 if(!['value','perlin','simplex','worley','worley-edge','white'].includes(s.noiseType))s.noiseType=defaults.noiseType;
 if(!['fbm','ridged','billow'].includes(s.fractal))s.fractal='fbm';
 for(const k of ['colorLow','colorHigh'])if(!/^#[0-9a-f]{6}$/i.test(s[k]))s[k]=defaults[k];
 if(!['dx','gl'].includes(s.convention))s.convention='dx';
 return s;
}
const mix=(a,b,t)=>a+(b-a)*t,fade=t=>t*t*t*(t*(t*6-15)+10),wrap=(x,p)=>(x%p+p)%p;
function hash(x,y,seed){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function noise(x,y,seed,period=0){const ix=Math.floor(x),iy=Math.floor(y),fx=fade(x-ix),fy=fade(y-iy);const h=(a,b)=>hash(period?wrap(a,period):a,period?wrap(b,period):b,seed);return mix(mix(h(ix,iy),h(ix+1,iy),fx),mix(h(ix,iy+1),h(ix+1,iy+1),fx),fy);}
const gradients=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
const clamp=v=>Math.max(0,Math.min(1,v));
function grad(x,y,seed,period){return gradients[Math.floor(hash(period?wrap(x,period):x,period?wrap(y,period):y,seed)*8)%8];}
function perlin(x,y,seed,period=0){const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy;const dot=(a,b)=>{const g=grad(ix+a,iy+b,seed,period);return g[0]*(dx-a)+g[1]*(dy-b);};return clamp(.5+mix(mix(dot(0,0),dot(1,0),fade(dx)),mix(dot(0,1),dot(1,1),fade(dx)),fade(dy))*.7);}
function simplex(x,y,seed){const f=(Math.sqrt(3)-1)/2,g=(3-Math.sqrt(3))/6,s=(x+y)*f,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*g,x0=x-i+t,y0=y-j+t,i1=x0>y0?1:0,j1=1-i1;const corner=(a,b,dx,dy)=>{const h=.5-dx*dx-dy*dy;if(h<=0)return 0;const v=grad(a,b,seed,0);return h*h*h*h*(v[0]*dx+v[1]*dy);};return clamp(.5+35*(corner(i,j,x0,y0)+corner(i+i1,j+j1,x0-i1+g,y0-j1+g)+corner(i+1,j+1,x0-1+2*g,y0-1+2*g)));}
function worley(x,y,seed,period=0,edge=false){const ix=Math.floor(x),iy=Math.floor(y),offsets=[0,-1,1,-2,2];let f1=Infinity,f2=Infinity;for(const b of offsets)for(const a of offsets){const cx=ix+a,cy=iy+b,bx=Math.max(cx-x,0,x-cx-1),by=Math.max(cy-y,0,y-cy-1);if(bx*bx+by*by>=(edge?f2:f1))continue;const hx=period?wrap(cx,period):cx,hy=period?wrap(cy,period):cy,dx=cx+hash(hx,hy,seed)-x,dy=cy+hash(hx,hy,seed^0x9e3779b9)-y,d=dx*dx+dy*dy;if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}return clamp(edge?(Math.sqrt(f2)-Math.sqrt(f1)):Math.sqrt(f1)/Math.SQRT2);}
function basis(x,y,seed,period,type){switch(type){case 'perlin':return perlin(x,y,seed,period);case 'simplex':return simplex(x,y,seed);case 'worley':return worley(x,y,seed,period);case 'worley-edge':return worley(x,y,seed,period,true);case 'white':return hash(period?wrap(Math.floor(x),period):Math.floor(x),period?wrap(Math.floor(y),period):Math.floor(y),seed);default:return noise(x,y,seed,period);}}
function fbm(u,v,s,seed,scale=1,levels=s.octaves){let value=0,weight=0,amp=1,f=s.frequency*scale;for(let o=0;o<levels;o++){const freq=s.seamless?Math.max(1,Math.round(f)):f;let h=basis(u*freq,v*freq,(seed+Math.imul(o,1013))>>>0,s.seamless?freq:0,s.noiseType);if(s.fractal==='ridged')h=(1-Math.abs(h*2-1))**2;else if(s.fractal==='billow')h=Math.abs(h*2-1);value+=h*amp;weight+=amp;amp*=s.persistence;f*=s.lacunarity;}return value/weight;}
function periodicFbm(u,v,s,seed,scale=1,levels=s.octaves){if(s.noiseType!=='simplex'||!s.seamless)return fbm(u,v,s,seed,scale,levels);u=wrap(u,1);v=wrap(v,1);return mix(mix(fbm(u,v,s,seed,scale,levels),fbm(u-1,v,s,seed,scale,levels),fade(u)),mix(fbm(u,v-1,s,seed,scale,levels),fbm(u-1,v-1,s,seed,scale,levels),fade(u)),fade(v));}
function heightAt(u,v,s,secondary=false){
 const seed=(s.seed+(secondary?91571:0))>>>0,scale=secondary?4:1;
 const raw=(a,b)=>{const angle=s.direction*Math.PI/180,c=Math.cos(angle),d=Math.sin(angle),stretch=1+s.anisotropy*14;return fbm((a*c+b*d)/stretch,(-a*d+b*c)*stretch,s,seed,scale);};
 let h;
 if(s.anisotropy<.001)h=periodicFbm(u,v,s,seed,scale);
 else if(s.seamless){u=wrap(u,1);v=wrap(v,1);h=mix(mix(raw(u,v),raw(u-1,v),fade(u)),mix(raw(u,v-1),raw(u-1,v-1),fade(u)),fade(v));}
 else h=raw(u,v);
 if(s.preset==='pores')h=1-Math.pow(Math.max(0,1-h*1.8),2);
 if(s.preset==='scratches')h=1-Math.pow(Math.max(0,1-Math.abs(h-.5)*12),3);
 if(s.preset==='fibers')h=Math.sin(h*18)*.25+.5;
 if(!secondary)h=mix(h,periodicFbm(u,v,s,seed+17,.25,2),s.macro*.65);
 return h;
}
function blur(data,n,r,tile){if(r<1)return data;let temp=new Float32Array(data.length),out=new Float32Array(data.length);const at=(a,x,y)=>a[(tile?wrap(y,n):Math.max(0,Math.min(n-1,y)))*n+(tile?wrap(x,n):Math.max(0,Math.min(n-1,x)))];for(let y=0;y<n;y++){let sum=0;for(let x=-r;x<=r;x++)sum+=at(data,x,y);for(let x=0;x<n;x++){temp[y*n+x]=sum/(2*r+1);sum+=at(data,x+r+1,y)-at(data,x-r,y);}}for(let x=0;x<n;x++){let sum=0;for(let y=-r;y<=r;y++)sum+=at(temp,x,y);for(let y=0;y<n;y++){out[y*n+x]=sum/(2*r+1);sum+=at(temp,x,y+r+1)-at(temp,x,y-r);}}return out;}
function generate(input,n,progress=()=>{}){
 if(!Number.isInteger(n)||n<8||n>4096)throw Error('Resolution must be 8–4096.');
 const s=settings(input);let primary=new Float32Array(n*n),detail=s.secondary?new Float32Array(n*n):null;
 for(let y=0;y<n;y++){for(let x=0;x<n;x++){const i=y*n+x;primary[i]=heightAt(x/n,y/n,s);if(detail)detail[i]=heightAt(x/n,y/n,s,true);}if(y%32===0)progress(y/n*.85);}
 const radius=Math.round(s.smoothing*n/512);primary=blur(primary,n,radius,s.seamless);if(detail)detail=blur(detail,n,radius,s.seamless);progress(1);return {s,n,primary,detail};
}
function normalAt(field,x,y){const {s,n,primary,detail}=field;const ix=(a,b)=>(s.seamless?wrap(b,n):Math.max(0,Math.min(n-1,b)))*n+(s.seamless?wrap(a,n):Math.max(0,Math.min(n-1,a)));const norm=(a,amount)=>{const nx=-(a[ix(x+1,y)]-a[ix(x-1,y)])*n*.5*s.strength*.02*amount,ny=-(a[ix(x,y-1)]-a[ix(x,y+1)])*n*.5*s.strength*.02*amount,len=Math.hypot(nx,ny,1);return [nx/len,ny/len,1/len];};let a=norm(primary,1);if(detail&&s.micro){const b=norm(detail,s.micro),t=[a[0],a[1],a[2]+1],u=[-b[0],-b[1],b[2]],dot=t[0]*u[0]+t[1]*u[1]+t[2]*u[2];a=[t[0]*dot/t[2]-u[0],t[1]*dot/t[2]-u[1],dot-u[2]];const l=Math.hypot(...a);a=a.map(v=>v/l);}return a;}
const srgbToLinear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const linearToSrgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
const color=hex=>[1,3,5].map(i=>srgbToLinear(parseInt(hex.slice(i,i+2),16)/255));
function pixels(field,type='normal',convention=field.s.convention){
 const {s,n,primary,detail}=field,out=new Uint8ClampedArray(n*n*4),low=color(s.colorLow),high=color(s.colorHigh);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x,j=i*4;let r,g,b;
  if(type==='normal'){const a=normalAt(field,x,y);r=(a[0]*(s.invertX?-1:1)*.5+.5)*255;g=(a[1]*(s.invertY?-1:1)*(convention==='dx'?-1:1)*.5+.5)*255;b=(a[2]*.5+.5)*255;}
  else{const h=clamp(primary[i]+(detail?detail[i]-.5:0)*s.micro*.2),t=clamp((h-.5)*s.colorContrast+.5);
   if(type==='albedo'){[r,g,b]=low.map((v,k)=>linearToSrgb(mix(v,high[k],t))*255);}
   else{const v=type==='specular'?mix(s.specularLow,s.specularHigh,h):type==='roughness'?mix(s.roughnessLow,s.roughnessHigh,h):h;r=g=b=v*255;}
  }
  out[j]=r;out[j+1]=g;out[j+2]=b;out[j+3]=255;
 }return out;
}
const api={defaults,presets,settings,basis,heightAt,generate,normalAt,pixels};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NoiseGeneratorCore=api;
})(typeof self!=='undefined'?self:globalThis);
