/* Exact Euclidean distance to the boundary of a thresholded pixel-cell silhouette.
 * Half-grid boundary samples include every endpoint and orthogonal projection of
 * an output pixel center, so the separable squared EDT is exact for this model. */
const INF=1e20;
function edt(f,n,out,v,z){let k=-1;for(let q=0;q<n;q++){if(f[q]>=INF)continue;let s=-Infinity;while(k>=0){const p=v[k];s=((f[q]+q*q)-(f[p]+p*p))/(2*(q-p));if(s>z[k])break;k--;}k++;v[k]=q;z[k]=k===0?-Infinity:s;z[k+1]=Infinity;}if(k<0){out.fill(INF,0,n);return;}let j=0;for(let q=0;q<n;q++){while(z[j+1]<q)j++;out[q]=(q-v[j])**2+f[v[j]];}}
export function generateSDF(mask,width,height,{range=32,invert=false,bias=0,diagnostic=false}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||mask.length!==width*height)throw Error('Invalid SDF dimensions or silhouette.');
 if(!Number.isFinite(range)||range<=0||!Number.isFinite(bias))throw Error('Distance range must be positive and finite.');
 const rows=2*height+1,cols=2*width+1,cost=new Float32Array(width*rows),seeds=new Uint8Array(cols),values=new Uint8Array(width*height),distances=diagnostic?new Float32Array(values.length):null;
 const at=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&mask[y*width+x]!==0;
 for(let gy=0;gy<rows;gy++){seeds.fill(0);const y=gy>>1;
  if(gy%2){for(let x=0;x<=width;x++)if(at(x-1,y)!==at(x,y))seeds[2*x]=1;}
  else{for(let x=0;x<width;x++)if(at(x,y-1)!==at(x,y)){seeds[2*x]=seeds[2*x+1]=seeds[2*x+2]=1;}for(let x=0;x<=width;x++)if(at(x-1,y-1)!==at(x,y-1)||at(x-1,y)!==at(x,y))seeds[2*x]=1;}
  let nearest=-1e10;for(let x=0;x<cols;x++){if(seeds[x])nearest=x;if(x%2)cost[gy*width+(x>>1)]=(x-nearest)**2;}
  nearest=1e10;for(let x=cols-1;x>=0;x--){if(seeds[x])nearest=x;if(x%2){const index=gy*width+(x>>1);cost[index]=Math.min(cost[index],(nearest-x)**2);}}
 }
 const f=new Float64Array(rows),out=new Float64Array(rows),v=new Int32Array(rows),z=new Float64Array(rows+1);let inside=0;
 for(let x=0;x<width;x++){for(let y=0;y<rows;y++)f[y]=cost[y*width+x];edt(f,rows,out,v,z);for(let y=0;y<height;y++){const index=y*width+x,isInside=!!mask[index];inside+=Number(isInside);let d=(isInside?1:-1)*Math.sqrt(out[2*y+1])/2;if(invert)d=-d;d+=bias;if(distances)distances[index]=d;values[index]=Math.round(255*Math.max(0,Math.min(1,.5+d/(2*range))));}}
 return{values,distances,inside,total:values.length};
}
export function sdfFilename(stem,size){return 'SDF_'+(stem.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,64)||'Shape')+'_'+size+'.png';}
