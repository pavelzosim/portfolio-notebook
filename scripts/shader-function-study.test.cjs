const {test}=require('node:test'),assert=require('node:assert/strict');
const api=()=>import('./shader-function-study.js'),near=(a,b,e=1e-6)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
test('lerp, saturate and smoothstep predict known scalar/vector values',async()=>{
 const m=await api(),x=m.functionDefaults('lerp');x.colorA=[0,0,0];x.colorB=[1,2,4];x.blend=[.25];assert.deepEqual(m.evaluateFunction('lerp',x).result,[.25,.5,1]);x.blend=[2];assert.deepEqual(m.evaluateFunction('lerp',x).result,[2,4,8]);
 assert.deepEqual(m.evaluateFunction('saturate',m.functionDefaults('saturate')).result,[0,.25,.75,1]);
 for(const [input,expected]of [[-1,0],[.5,.5],[2,1]])near(m.evaluateFunction('smoothstep',{edgeStart:[0],edgeEnd:[1],value:[input]}).result,expected);
});
test('dot, normalize and reflect preserve mathematical meanings and undefined cases',async()=>{
 const m=await api();near(m.evaluateFunction('dot',m.functionDefaults('dot')).result,.6);
 const n=m.evaluateFunction('normalize',m.functionDefaults('normalize')).result;near(n[0],.6);near(n[1],.8);assert.equal(n[2],0);
 const r=m.evaluateFunction('reflect',m.functionDefaults('reflect')).result;near(r[0],.6);near(r[1],.8);assert.equal(r[2],0);
 assert.throws(()=>m.evaluateFunction('normalize',{direction:[0,0,0]}),/zero-length/);
 const nonunit=m.functionDefaults('reflect');nonunit.surfaceNormal=[0,2,0];assert.match(m.evaluateFunction('reflect',nonunit).note,/not unit length/);
});
test('mul uses logical matrix rows and a column vector, independent of buffer orientation',async()=>{
 const m=await api(),input=m.functionDefaults('mul');assert.deepEqual(m.evaluateFunction('mul',input).result,input.position.map(Math.fround));
 input.transform=[1,0,0,2,0,1,0,3,0,0,1,4,0,0,0,1];input.position=[1,2,3,1];assert.deepEqual(m.evaluateFunction('mul',input).result,[3,5,7,1]);
});
test('invalid or float32-collapsed ranges fail, while all default intermediate results are float32',async()=>{
 const m=await api();assert.throws(()=>m.evaluateFunction('smoothstep',{edgeStart:[500000],edgeEnd:[500000.001],value:[.5]}),/after float32 rounding/);assert.throws(()=>m.evaluateFunction('lerp',{colorA:[NaN,0,0]}));
 for(const key of Object.keys(m.FUNCTION_INPUTS)){const r=m.evaluateFunction(key,m.functionDefaults(key));for(const value of [...r.steps.map(s=>s.value),r.result])for(const n of Array.isArray(value)?value:[value]){assert(Number.isFinite(n));assert.equal(Math.fround(n),n);}}
});
