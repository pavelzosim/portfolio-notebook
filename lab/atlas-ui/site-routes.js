// Branch-only full-site routes. Content stays in the existing registries.
export async function createSiteRoutes(){
 const [posts,projects]=await Promise.all(['/content/posts/index.json','/content/projects/index.json'].map(async path=>{const response=await fetch(path);if(!response.ok)throw Error('Registry unavailable: '+path);return response.json();}));
 const records=posts.records.filter(r=>r.state==='published'&&r.indexable!==false),routes=new Map();
 const production=document.body.hasAttribute('data-public-page');
 const publicRoutes={home:'/',projects:'/projects/',tools:'/tools/',blog:'/blog/',components:'/blog/style-guide/',index:'/online-tools/',tool:'/online-tools/sprite-sheet-assembly/',compressor:'/online-tools/image-compressor/',noise:'/online-tools/noise-generator/',privacy:'/privacy/',notfound:'/404.html'};
 const publicTarget=target=>{const params=new URLSearchParams(target.split('#')[0]);const page=params.get('page');return page==='article'?'/post/'+(params.get('slug')||'procedural-travel-resolution')+'/':page==='project'?'/projects/'+(params.get('slug')||'nasa-first-woman')+'/':publicRoutes[page];};
 const add=(path,target)=>{if(path){const url=new URL(path,location.origin);routes.set(url.pathname.replace(/\/$/,''),target);}};
 for(const [path,page]of [['/','home'],['/projects/','projects'],['/tools/','tools'],['/blog/','blog'],['/blog/style-guide/','components'],['/online-tools/','index'],['/online-tools/sprite-sheet-assembly/','tool'],['/online-tools/image-compressor/','compressor'],['/online-tools/noise-generator/','noise'],['/privacy/','privacy']])add(path,'?page='+page);
 for(const record of records)for(const path of [record.localPath,record.sourcePath,record.publicUrl,record.sourceUrl])add(path,'?page=article&slug='+encodeURIComponent(record.slug));
 for(const record of projects.projects)add('/projects/'+record.slug+'/','?page=project&slug='+encodeURIComponent(record.slug));
 const rewrite=root=>root.querySelectorAll('a[href]').forEach(link=>{
  const raw=link.getAttribute('href');if(!raw||raw.startsWith('#')||link.hasAttribute('download'))return;
  if(raw.startsWith('?')){if(production&&new URLSearchParams(raw.split('#')[0]).has('page')){const target=publicTarget(raw);if(target)link.setAttribute('href',target+(raw.includes('#')?'#'+raw.split('#')[1]:''));}return;}
  const url=new URL(raw,location.origin);if(![location.hostname,'www.pavelzosim.com','pavelzosim.com'].includes(url.hostname))return;
  const target=routes.get(url.pathname.replace(/\/$/,''));if(target)link.setAttribute('href',(production?publicTarget(target):target)+url.hash);
 });
 const observe=root=>{rewrite(root);new MutationObserver(changes=>{for(const change of changes)for(const node of change.addedNodes)if(node.nodeType===1){if(node.matches('a[href]'))rewrite(node.parentElement);else rewrite(node);}}).observe(root,{childList:true,subtree:true});};
 return {records,projects:projects.projects,rewrite,observe};
}
