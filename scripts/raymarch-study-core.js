// A bounded CPU teaching model of one fixed HLSL program, not an HLSL interpreter.
export const BUFFER_DECLARATIONS=`float3 cameraPosition;
float tanHalfFov;
float2 resolution;
uint maxSteps;
float hitEpsilon;
float3 sphereCenter;
float sphereRadius;
float3 lightDirection;
float lightIntensity;
float3 baseColor;
float exposure;
float maxDistance;`;
export const DEFAULTS=Object.freeze({width:192,height:192,cameraDistance:3.5,fov:50,radius:1,maxSteps:64,epsilon:.001,maxDistance:20,lightAzimuth:35,lightElevation:45,lightIntensity:1.4,exposure:1});
export function studySettings(input={}){
 const c={...DEFAULTS,...input};
 const rules={width:[32,256,true],height:[32,256,true],cameraDistance:[1.75,8],fov:[25,90],radius:[.25,1.5],maxSteps:[1,128,true],epsilon:[.0001,.02],maxDistance:[.1,30],lightAzimuth:[-180,180],lightElevation:[5,85],lightIntensity:[0,8],exposure:[.25,4]};
 for(const [key,[min,max,integer]]of Object.entries(rules)){const n=Number(c[key]);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`${key}: enter ${integer?'an integer':'a number'} from ${min} to ${max}.`);c[key]=integer?n:Math.fround(n);}
 return c;
}
// Ideal, non-fused float32 operations. This is not a GPU ISA emulator: native
// reciprocal/sqrt/pow approximations, FMA and reassociation can differ.
const f=Math.fround;
const add=(a,b)=>a.map((v,i)=>f(v+b[i])),scale=(v,s)=>v.map(x=>f(x*s)),sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
export const dot=(a,b)=>a.reduce((n,v,i)=>f(n+f(v*b[i])),0);
const length=v=>f(Math.sqrt(dot(v,v)));
export const normalize=v=>{const n=length(v);return n?v.map(x=>f(x/n)):[0,0,0];};
const clamp=x=>Math.min(1,Math.max(0,x));
export function parameters(c){
 const a=c.lightAzimuth*Math.PI/180,e=c.lightElevation*Math.PI/180;
 return {cameraPosition:[0,0,c.cameraDistance],tanHalfFov:Math.fround(Math.tan(c.fov*Math.PI/360)),resolution:[c.width,c.height],maxSteps:c.maxSteps,hitEpsilon:c.epsilon,sphereCenter:[0,0,0],sphereRadius:c.radius,lightDirection:[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)].map(Math.fround),lightIntensity:c.lightIntensity,baseColor:[.12,.35,.7].map(Math.fround),exposure:c.exposure,maxDistance:c.maxDistance};
}
export function parameterBytes(c,layout){
 const data=new Uint8Array(layout.span),view=new DataView(data.buffer),p=parameters(c);
 for(const field of layout.rows){const values=Array.isArray(p[field.name])?p[field.name]:[p[field.name]];values.forEach((value,i)=>{if(field.type==='uint')view.setUint32(field.offset+i*4,value,true);else view.setFloat32(field.offset+i*4,value,true);});}
 return data;
}
export const sceneSDF=(p,params)=>f(length(sub(p,params.sphereCenter))-params.sphereRadius);
export function rayDirection(c,x,y,p=parameters(c)){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=c.width||y>=c.height)throw Error('Pixel coordinates are outside the frame.');
 const uv=[f(f(f(2*(x+.5))/c.width)-1),f(1-f(f(2*(y+.5))/c.height))],aspect=f(c.width/c.height);
 return {uv,position:[x+.5,y+.5],origin:p.cameraPosition,direction:normalize([f(f(uv[0]*aspect)*p.tanHalfFov),f(uv[1]*p.tanHalfFov),-1])};
}
function march(origin,direction,c,p,record){
 let t=0,samples=0;const steps=[];
 for(let i=0;i<c.maxSteps;i++){
  if(t>p.maxDistance)return {hit:false,reason:'distance-limit',t,samples,steps,point:null};
  const point=add(origin,scale(direction,t)),distance=sceneSDF(point,p);samples++;
  const hit=distance<p.hitEpsilon,nextT=hit?t:f(t+distance);
  if(record)steps.push({index:i,t,point,distance,nextT,action:hit?'hit':i===c.maxSteps-1?'step-limit':nextT>p.maxDistance?'advance → distance-limit':'advance'});
  if(hit)return {hit:true,reason:'hit',t,samples,steps,point};
  t=nextT;
 }
 return {hit:false,reason:'step-limit',t,samples,steps,point:null};
}
export function normalAt(point,p){
 const e=Math.max(p.hitEpsilon,f(.0001)),gradient=[0,1,2].map(axis=>{const d=[0,0,0];d[axis]=e;return f(sceneSDF(add(point,d),p)-sceneSDF(sub(point,d),p));});
 return {normal:normalize(gradient),gradient,epsilon:e};
}
export const encodeSRGB=x=>x<=f(.0031308)?f(f(12.92)*x):f(f(f(1.055)*f(Math.pow(x,f(1/f(2.4)))))-f(.055));
export function displayColor(linear,exposure){
 const exposed=linear.map(x=>f(x*exposure)),mapped=exposed.map(x=>clamp(f(x/f(1+x)))),encoded=mapped.map(encodeSRGB),rgba=[...encoded.map(x=>Math.round(clamp(x)*255)),255];
 return {exposed,mapped,encoded,rgba};
}
export function evaluatePixel(c,x,y,{record=true,params=parameters(c)}={}){
 const ray=rayDirection(c,x,y,params),result=march(ray.origin,ray.direction,c,params,record);
 let surface=null,diffuse=0,linear;
 if(result.hit){surface=normalAt(result.point,params);diffuse=clamp(dot(surface.normal,normalize(params.lightDirection)));linear=params.baseColor.map(v=>f(v*f(f(.08)+f(params.lightIntensity*diffuse))));}
 else{const blend=clamp(f(.5*f(ray.direction[1]+1)));linear=[.02,.03,.06].map((v,i)=>f(f(v)+f(blend*f(f([.12,.18,.28][i])-f(v)))));}
 return {pixel:[x,y],ray,...result,surface,diffuse,linear,...displayColor(linear,params.exposure),sdfCalls:result.samples+(result.hit?6:0)};
}
export function renderStudy(c){
 const data=new Uint8ClampedArray(c.width*c.height*4),p=parameters(c);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)data.set(evaluatePixel(c,x,y,{record:false,params:p}).rgba,(y*c.width+x)*4);
 return {width:c.width,height:c.height,data};
}
export const STAGES=Object.freeze([
 {id:'source',title:'HLSL / parameters',description:'Reference source and a 96-byte legacy cbuffer. Compilation and API setup are shown as a contract; the browser runs a CPU model.'},
 {id:'vertex',title:'VS → rasterizer',description:'VSMain generates three clip-space vertices. The reference draw is a fullscreen triangle: Draw(3,0), no vertex buffer, culling off, depth off, blending off, one sample.'},
 {id:'ray',title:'PS → camera ray',description:'The selected pixel center supplies SV_Position. RayDirection maps it through aspect ratio and field of view to a normalized world-space ray.'},
 {id:'march',title:'Raymarch loop',description:'t survives between iterations. p and d are replaced on each sample. The model records this pixel only; these are value lifetimes, not a register-allocation report.'},
 {id:'sdf',title:'SceneSDF',description:'Distance to a sphere: length(p − sphereCenter) − sphereRadius. The distance bounds the next sphere-tracing step.'},
 {id:'normal',title:'Surface normal',description:'After a hit, six additional SDF samples estimate the gradient by central differences, then normalize it. This stage is skipped on a miss.'},
 {id:'shade',title:'Light / sky',description:'A hit uses diffuse light plus a fixed ambient term. A miss takes the sky branch. Colors here are linear, before exposure and tone mapping.'},
 {id:'output',title:'Color → target',description:'Apply exposure, Reinhard tone mapping, explicit linear-to-sRGB encoding and 8-bit UNORM quantization. The reference target is R8G8B8A8_UNORM, not an sRGB target, to avoid double encoding.'}
]);
export const HLSL_PARTS=Object.freeze({
 source:`cbuffer StudyParameters : register(b0)
{
${BUFFER_DECLARATIONS.split('\n').map(s=>'    '+s).join('\n')}
};`,
 vertex:`float4 VSMain(uint vertexID : SV_VertexID) : SV_Position
{
    float2 uv = float2((vertexID << 1) & 2, vertexID & 2);
    return float4(uv * float2(2, -2) + float2(-1, 1), 0, 1);
}`,
 sdf:`float SceneSDF(float3 p)
{
    return length(p - sphereCenter) - sphereRadius;
}`,
 ray:`float3 RayDirection(float2 pixelCenter)
{
    float2 uv = float2(2 * pixelCenter.x / resolution.x - 1,
                      1 - 2 * pixelCenter.y / resolution.y);
    float aspect = resolution.x / resolution.y;
    return normalize(float3(uv.x * aspect * tanHalfFov,
                            uv.y * tanHalfFov, -1));
}`,
 march:`struct MarchHit
{
    bool hit;
    float t;
    float3 position;
    uint samples;
    uint reason; // 1 hit, 2 distance limit, 3 step limit
};

MarchHit Raymarch(float3 ro, float3 rd)
{
    MarchHit h = (MarchHit)0;
    float t = 0;
    [loop] for (uint i = 0; i < maxSteps; ++i)
    {
        if (t > maxDistance) { h.t = t; h.reason = 2; return h; }
        float3 p = ro + rd * t;
        float d = SceneSDF(p);
        h.samples = i + 1;
        if (d < hitEpsilon)
        {
            h.hit = true; h.t = t; h.position = p; h.reason = 1;
            return h;
        }
        t += d;
    }
    h.t = t; h.reason = 3;
    return h;
}`,
 normal:`float3 SurfaceNormal(float3 p)
{
    float e = max(hitEpsilon, 0.0001);
    float3 gradient = float3(
        SceneSDF(p + float3(e,0,0)) - SceneSDF(p - float3(e,0,0)),
        SceneSDF(p + float3(0,e,0)) - SceneSDF(p - float3(0,e,0)),
        SceneSDF(p + float3(0,0,e)) - SceneSDF(p - float3(0,0,e)));
    return normalize(gradient);
}`,
 shade:`float3 Shade(MarchHit h, float3 rd)
{
    if (!h.hit)
        return lerp(float3(0.02,0.03,0.06), float3(0.12,0.18,0.28),
                    saturate(0.5 * (rd.y + 1)));
    float3 n = SurfaceNormal(h.position);
    float diffuse = saturate(dot(n, normalize(lightDirection)));
    return baseColor * (0.08 + lightIntensity * diffuse);
}`,
 output:`float EncodeSRGB(float x)
{
    return x <= 0.0031308 ? 12.92 * x : 1.055 * pow(x, 1.0/2.4) - 0.055;
}

float3 ToDisplay(float3 linearColor)
{
    float3 exposed = linearColor * exposure;
    float3 mapped = saturate(exposed / (1 + exposed));
    return float3(EncodeSRGB(mapped.r), EncodeSRGB(mapped.g), EncodeSRGB(mapped.b));
}`,
 main:`float4 PSMain(float4 pixelPosition : SV_Position) : SV_Target
{
    float3 rd = RayDirection(pixelPosition.xy);
    MarchHit hit = Raymarch(cameraPosition, rd);
    float3 linearColor = Shade(hit, rd);
    return float4(ToDisplay(linearColor), 1);
}`
});
export const FULL_HLSL=`// From Function to Pixel — fixed SDF sphere study.
// Compile separately: dxc -T vs_6_0 -E VSMain Raymarch_Study.hlsl
//                    dxc -T ps_6_0 -E PSMain Raymarch_Study.hlsl
// Draw(3,0); fullscreen viewport matching resolution; cull/depth/blend OFF;
// one sample; R8G8B8A8_UNORM target (NOT SRGB: encoding is explicit).
// Bind StudyParameters to b0. Buffer fields are float32/uint32, little endian.
// CPU prediction rounds scalar operations to float32, without fused operations.
// Compiler reassociation and GPU intrinsic approximations can change results.

${Object.values(HLSL_PARTS).join('\n\n')}\n`;
