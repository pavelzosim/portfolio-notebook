const {test}=require('node:test'),assert=require('node:assert/strict');
const core=()=>import('./raymarch-study-core.js');
const near=(a,b,e=1e-6)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
test('center ray reaches the analytic sphere surface and counts six normal probes',async()=>{
 const m=await core(),c=m.studySettings({width:129,height:129}),r=m.evaluatePixel(c,64,64);
 assert.deepEqual(r.ray.direction,[0,0,-1]);assert.equal(r.reason,'hit');assert.equal(r.samples,2);near(r.t,2.5);assert.deepEqual(r.point,[0,0,1]);assert.deepEqual(r.surface.normal,[0,0,1]);assert.equal(r.sdfCalls,8);
 assert.deepEqual(r.steps.map(s=>s.t),[0,2.5]);assert.deepEqual(r.steps.map(s=>s.distance),[2.5,0]);
});
test('distance and sample limits terminate independently without hidden SDF samples',async()=>{
 const m=await core(),a=m.evaluatePixel(m.studySettings({width:129,height:129,maxSteps:1}),64,64),b=m.evaluatePixel(m.studySettings({width:129,height:129,maxDistance:1}),64,64);
 assert.equal(a.reason,'step-limit');assert.equal(a.samples,1);assert.equal(a.sdfCalls,1);assert.equal(a.surface,null);
 assert.equal(b.reason,'distance-limit');assert.equal(b.samples,1);assert.equal(b.sdfCalls,1);assert.equal(b.steps.length,1);
 const miss=m.evaluatePixel(m.studySettings(),0,0);assert.equal(miss.hit,false);assert.equal(miss.surface,null);assert.equal(miss.sdfCalls,miss.samples);
});
test('ray mapping samples pixel centers with top-left Y and aspect ratio',async()=>{
 const m=await core(),c=m.studySettings({width:256,height:144});const a=m.rayDirection(c,0,0),b=m.rayDirection(c,255,143);assert(a.direction[0]<0&&a.direction[1]>0);assert(b.direction[0]>0&&b.direction[1]<0);near(a.direction[0],-b.direction[0]);near(a.direction[1],-b.direction[1]);near(Math.hypot(...a.direction),1);
 assert.throws(()=>m.rayDirection(c,-1,0),/outside/);assert.throws(()=>m.rayDirection(c,0.5,0),/outside/);
});
test('float32 central differences approximate sphere normals within cancellation error at epsilon .001',async()=>{
 // Subtracting SDF probes divides float32 rounding error by the finite-
 // difference epsilon; a 1e-4 component bound is appropriate here.
 const m=await core(),p=m.parameters(m.studySettings());for(const v of [[1,0,0],[0,-1,0],[.3,.4,.5]]){const n=m.normalize(v),a=m.normalAt(n,p).normal;a.forEach((x,i)=>near(x,n[i],1e-4));}
});
test('predicted shader intermediates are rounded to float32 rather than JavaScript doubles',async()=>{
 const m=await core(),c=m.studySettings();
 const check=value=>{if(Array.isArray(value))value.forEach(check);else if(value&&typeof value==='object')Object.values(value).forEach(check);else if(typeof value==='number'){assert(Number.isFinite(value));assert.equal(Math.fround(value),value);}};
 for(const pixel of [[0,0],[96,96],[125,100],[145,130]])check(m.evaluatePixel(c,...pixel));
 const r=m.evaluatePixel(c,125,100);for(const step of r.steps)if(step.action==='advance')assert.equal(step.nextT,Math.fround(step.t+step.distance));
});
test('tone mapping, sRGB transfer and quantization stay finite and bounded',async()=>{
 const m=await core();near(m.encodeSRGB(0),0);near(m.encodeSRGB(1),1);near(m.encodeSRGB(.0031308),.040449936,1e-8);
 const a=m.displayColor([0,1,1000],1);assert.deepEqual(a.mapped.slice(0,2),[0,.5]);assert.equal(a.rgba[0],0);assert.equal(a.rgba[3],255);assert(a.rgba.every(x=>Number.isInteger(x)&&x>=0&&x<=255));assert(m.displayColor([.1,.2,.3],2).rgba[0]>m.displayColor([.1,.2,.3],1).rgba[0]);
});
test('preview pixels exactly match selected-pixel evaluator for the CPU model',async()=>{
 const m=await core(),c=m.studySettings({width:32,height:32}),image=m.renderStudy(c);for(const [x,y]of [[0,0],[16,16],[31,31],[8,15]])assert.deepEqual(Array.from(image.data.slice((y*32+x)*4,(y*32+x)*4+4)),m.evaluatePixel(c,x,y).rgba);
 const p=m.evaluatePixel(c,16,16),q=m.evaluatePixel({...c,lightIntensity:0},16,16);assert.equal(p.samples,q.samples);assert.notDeepEqual(p.rgba,q.rgba);
});
test('parameter bytes use reflection offsets, float32/uint32 little endian and zero tail padding',async()=>{
 const m=await core(),l=await import('./shader-memory-core.js'),layout=l.calculateLayout(l.parseDeclarations(m.BUFFER_DECLARATIONS)),a=m.studySettings(),b=m.studySettings({maxSteps:1,lightIntensity:0});
 assert.equal(layout.payload,84);assert.equal(layout.extent,84);assert.equal(layout.span,96);assert.deepEqual(layout.rows.map(f=>f.offset),[0,12,16,24,28,32,44,48,60,64,76,80]);
 const data=m.parameterBytes(a,layout),view=new DataView(data.buffer);assert.equal(view.getUint32(24,true),64);assert.equal(view.getFloat32(8,true),3.5);assert.equal(view.getFloat32(44,true),1);assert(data.slice(84).every(n=>n===0));assert.equal(m.parameterBytes(b,layout).length,96);
});
test('settings reject nonfinite, out-of-bounds and fractional execution limits',async()=>{
 const m=await core();for(const x of [{width:1024},{maxSteps:129},{maxSteps:2.5},{epsilon:NaN},{radius:0},{exposure:Infinity}])assert.throws(()=>m.studySettings(x));
});
