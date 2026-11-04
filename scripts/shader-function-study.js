// Fixed educational overloads, not arbitrary HLSL evaluation or GPU emulation.
const f=Math.fround,vector=(n,v)=>Array.from({length:n},(_,i)=>f(v[i]));
const dot=(a,b)=>a.reduce((sum,v,i)=>f(sum+f(v*b[i])),0),length=a=>f(Math.sqrt(dot(a,a)));
export const FUNCTION_INPUTS=Object.freeze({
 lerp:[{name:'colorA',values:[.1,.2,.4]},{name:'colorB',values:[.8,.4,.1]},{name:'blend',values:[.5]}],
 saturate:[{name:'value',values:[-.25,.25,.75,1.5]}],
 smoothstep:[{name:'edgeStart',values:[.2]},{name:'edgeEnd',values:[.8]},{name:'value',values:[.5]}],
 dot:[{name:'directionA',values:[1,0,0]},{name:'directionB',values:[.6,.8,0]}],
 normalize:[{name:'direction',values:[3,4,0]}],
 reflect:[{name:'incident',values:[.6,-.8,0]},{name:'surfaceNormal',values:[0,1,0]}],
 mul:[{name:'transform',values:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},{name:'position',values:[.2,.4,.6,1]}]
});
export const functionDefaults=key=>Object.fromEntries((FUNCTION_INPUTS[key]||[]).map(item=>[item.name,item.values.slice()]));
export function evaluateFunction(key,input){
 const spec=FUNCTION_INPUTS[key];if(!spec)throw Error('Unknown function example.');const v={};
 for(const field of spec){const values=input[field.name];if(!Array.isArray(values)||values.length!==field.values.length||values.some(x=>!Number.isFinite(Number(x))||Math.abs(Number(x))>1e6))throw Error(field.name+': enter finite values between −1,000,000 and 1,000,000.');v[field.name]=values.map(x=>f(Number(x)));}
 const steps=[],add=(title,formula,value)=>{steps.push({title,formula,value});return value;};let result,note='Ideal non-fused float32 calculation of this overload.';
 if(key==='lerp'){
  const delta=add('Subtract','colorB − colorA',v.colorA.map((a,i)=>f(v.colorB[i]-a)));
  const weighted=add('Multiply','blend × difference',delta.map(x=>f(x*v.blend[0])));
  result=add('Add','colorA + weighted difference',weighted.map((x,i)=>f(x+v.colorA[i])));
 }
 if(key==='saturate'){const low=add('Lower bound','max(value, 0)',v.value.map(x=>Math.max(0,x)));result=add('Upper bound','min(previous, 1)',low.map(x=>Math.min(1,x)));}
 if(key==='smoothstep'){
  const [a,b,x]=[v.edgeStart[0],v.edgeEnd[0],v.value[0]];if(!(a<b))throw Error('edgeStart must be smaller than edgeEnd after float32 rounding.');
  const numerator=add('Subtract','value − edgeStart',f(x-a)),denominator=add('Range','edgeEnd − edgeStart',f(b-a));
  const t=add('Normalize & clamp','saturate(numerator / range)',Math.min(1,Math.max(0,f(numerator/denominator))));
  const square=add('Square','t × t',f(t*t)),factor=add('Hermite factor','3 − 2 × t',f(3-f(2*t)));result=add('Multiply','t² × (3 − 2t)',f(square*factor));
 }
 if(key==='dot'){
  const products=add('Products','directionA[i] × directionB[i]',v.directionA.map((x,i)=>f(x*v.directionB[i]))),partial=add('Accumulate XY','product.x + product.y',f(products[0]+products[1]));result=add('Accumulate Z','previous + product.z',f(partial+products[2]));
 }
 if(key==='normalize'){
  const square=add('Squared length','dot(direction, direction)',dot(v.direction,v.direction));if(square===0)throw Error('normalize has no defined result for a zero-length input.');
  const magnitude=add('Length','sqrt(squared length)',f(Math.sqrt(square)));result=add('Divide','direction / length',v.direction.map(x=>f(x/magnitude)));
 }
 if(key==='reflect'){
  const d=add('Dot','dot(surfaceNormal, incident)',dot(v.surfaceNormal,v.incident)),twice=add('Double','2 × dot',f(2*d)),projection=add('Project','surfaceNormal × twice dot',v.surfaceNormal.map(x=>f(x*twice)));
  result=add('Subtract','incident − projection',v.incident.map((x,i)=>f(x-projection[i])));
  if(Math.abs(length(v.surfaceNormal)-1)>.001)note+=' The supplied normal is not unit length; this is the algebraic HLSL result, not a normalized geometric reflection.';
 }
 if(key==='mul'){
  result=[];for(let row=0;row<4;row++){const products=add('Row '+row+' products','matrix row '+row+' × column vector',vector(4,v.transform.slice(row*4,row*4+4)).map((x,i)=>f(x*v.position[i])));const sum=products.reduce((n,x)=>f(n+x),0);result.push(sum);add('Row '+row+' sum','sum of row '+row+' products',sum);}
 }
 if(steps.some(s=>(Array.isArray(s.value)?s.value:[s.value]).some(x=>!Number.isFinite(x))))throw Error('This input exceeds the finite range of the float32 model.');
 return {inputs:v,steps,result,note};
}
