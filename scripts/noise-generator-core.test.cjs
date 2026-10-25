const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('./noise-generator-core.js');
test('all bases and fractals are seeded, bounded, distinct and tileable',()=>{
 const fingerprints=new Set();
 for(const noiseType of ['value','perlin','simplex','worley','worley-edge','white']){
  for(const fractal of ['fbm','ridged','billow']){
   const s=C.settings({noiseType,fractal,macro:.3});
   const samples=[];
   for(let i=0;i<20;i++){const u=i*.0317,v=i*.0173;const h=C.heightAt(u,v,s);assert.ok(Number.isFinite(h)&&h>=0&&h<=1);assert.ok(Math.abs(h-C.heightAt(u+1,v,s))<1e-7,noiseType+fractal);assert.ok(Math.abs(h-C.heightAt(u,v+1,s))<1e-7);samples.push(h.toFixed(5));}
   fingerprints.add(samples.join(','));
  }
 }
 assert.equal(fingerprints.size,18);
});
test('albedo exports sRGB palette endpoints; specular is linear F0 independent of roughness',()=>{
 const s=C.settings({colorLow:'#204080',colorHigh:'#e0a050',specularLow:.04,specularHigh:.08,roughnessLow:.1,roughnessHigh:.9});
 const f={s,n:2,primary:new Float32Array([0,1,0,1]),detail:null};
 const a=C.pixels(f,'albedo'),sp=C.pixels(f,'specular'),r=C.pixels(f,'roughness');
 assert.deepEqual([...a.slice(0,3)],[32,64,128]);assert.deepEqual([...a.slice(4,7)],[224,160,80]);
 assert.equal(sp[0],10);assert.equal(sp[4],20);assert.equal(r[0],26);assert.equal(r[4],230);
 assert.deepEqual(sp,C.pixels({...f,s:{...s,roughnessLow:1,roughnessHigh:0}},'specular'));
});
test('color controls never change generated geometry and invalid colors are rejected safely',()=>{
 const a=C.generate({noiseType:'simplex'},16),b=C.generate({noiseType:'simplex',colorLow:'#ff0000',specularHigh:.1},16);
 assert.deepEqual(a.primary,b.primary);assert.deepEqual(C.pixels(a,'normal'),C.pixels(b,'normal'));assert.equal(C.settings({colorLow:'not-a-color'}).colorLow,C.defaults.colorLow);
});
test('same seed reproduces maps; changing seed changes the surface',()=>{const a=C.generate({seed:42},24),b=C.generate({seed:42},24),c=C.generate({seed:43},24);assert.deepEqual(a.primary,b.primary);assert.notDeepEqual(a.primary,c.primary);assert.deepEqual(C.pixels(a),C.pixels(b));});
test('periodic fields match across UV periods, including anisotropic presets',()=>{for(const preset of Object.keys(C.presets)){const s=C.settings({...C.presets[preset],preset,seamless:true});for(const [u,v] of [[0,.2],[.3,0],[.4,.7]]){assert.ok(Math.abs(C.heightAt(u,v,s)-C.heightAt(u+1,v,s))<1e-8,preset);assert.ok(Math.abs(C.heightAt(u,v,s,true)-C.heightAt(u,v+1,s,true))<1e-8,preset);}}});
test('RNM normals have unit length and zero strength is flat',()=>{const field=C.generate({strength:4,micro:1},32);for(let y=0;y<32;y++)for(let x=0;x<32;x++)assert.ok(Math.abs(Math.hypot(...C.normalAt(field,x,y))-1)<1e-6);const flat=C.pixels(C.generate({strength:0},8));for(let i=0;i<flat.length;i+=4)assert.deepEqual([...flat.slice(i,i+4)],[128,128,255,255]);});
test('DirectX and OpenGL differ only in green; inverse channels are independent',()=>{const f=C.generate({},16),dx=C.pixels(f,'normal','dx'),gl=C.pixels(f,'normal','gl');for(let i=0;i<dx.length;i+=4){assert.equal(dx[i],gl[i]);assert.equal(dx[i+2],gl[i+2]);assert.ok(Math.abs(dx[i+1]+gl[i+1]-255)<=1);}const ix=C.pixels({...f,s:{...f.s,invertX:true}},'normal','gl');for(let i=0;i<gl.length;i+=4){assert.equal(ix[i+1],gl[i+1]);assert.ok(Math.abs(ix[i]+gl[i]-255)<=1);}});
test('sampling uses resolution-independent UV slopes',()=>{const a=C.generate({frequency:4,octaves:1,smoothing:0,secondary:false},64),b=C.generate({frequency:4,octaves:1,smoothing:0,secondary:false},128);const n1=C.normalAt(a,17,23),n2=C.normalAt(b,34,46);assert.ok(n1.every((v,i)=>Math.abs(v-n2[i])<.01));});
test('roughness and height remain opaque grayscale data',()=>{const f=C.generate({},16);for(const type of ['height','roughness']){const p=C.pixels(f,type);for(let i=0;i<p.length;i+=4){assert.equal(p[i],p[i+1]);assert.equal(p[i],p[i+2]);assert.equal(p[i+3],255);}}assert.throws(()=>C.generate({},8192));});
