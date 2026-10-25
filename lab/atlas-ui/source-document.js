// Read authoring inputs independently from rendered public routes. This avoids
// self-fetching a rendered page when the canonical shell replaces its template.
let sourceMap;
export async function readSourceDocument(path){
 const url=new URL(path,import.meta.url);
 if(document.body.hasAttribute('data-public-page')){
  sourceMap??=fetch(new URL('./source-map.json',import.meta.url)).then(response=>{if(!response.ok)throw Error('Source map unavailable');return response.json();});
  const map=await sourceMap,key=url.pathname.replace(/\/$/,'')||'/';
  const file=map[key];if(!file)throw Error('Unknown content input: '+url.pathname);
  const response=await fetch(new URL(file,import.meta.url));if(!response.ok)throw Error('Content input unavailable');
  return new DOMParser().parseFromString(await response.json(),'text/html');
 }
 const response=await fetch(url);if(!response.ok)throw Error('Content unavailable: '+path);
 return new DOMParser().parseFromString(await response.text(),'text/html');
}
