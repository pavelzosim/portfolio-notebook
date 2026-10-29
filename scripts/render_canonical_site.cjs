// Render the approved shared shell into static HTML; the same modules own live behaviour.
const fs=require('node:fs'),path=require('node:path');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/pavel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'..'),output=path.join(root,'_site');
const origin=process.argv[2];if(!origin)throw Error('Local source origin required');
const assetVersion=JSON.parse(fs.readFileSync(path.join(output,'ui/atlas/release.json'),'utf8')).version;
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const posts=read('content/posts/index.json').records.filter(r=>r.state==='published'&&r.indexable!==false);
const projects=read('content/projects/index.json').projects,revisions=read('lab/atlas-ui/article-revisions.json');
const entries=[['/','home'],['/blog/','blog'],['/projects/','projects'],['/tools/','tools'],['/online-tools/','index'],['/online-tools/sprite-sheet-assembly/','tool'],['/online-tools/image-compressor/','compressor'],['/online-tools/noise-generator/','noise'],['/online-tools/pbr-channel-packer/','packer'],['/online-tools/normal-map-generator/','material'],['/online-tools/sdf-texture-generator/','sdf'],['/online-tools/flow-map-generator/','flow'],['/privacy/','privacy'],['/blog/style-guide/','components'],...posts.map(r=>[new URL(r.publicUrl).pathname,'article',r.slug]),...projects.map(r=>['/projects/'+r.slug+'/','project',r.slug])];
const routes=Object.fromEntries(entries.map(([url,page,slug])=>[page+(slug?':'+slug:''),url]));
routes.article='/post/procedural-travel-resolution/';routes.project='/projects/nasa-first-woman/';
for(const r of posts)routes[r.localPath]=new URL(r.publicUrl).pathname;
(async()=>{const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined);const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
try{let p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),renderCount=0;
// Optional third-party embeds/fonts never gate a deterministic local build.
await p.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();return route.continue();});
for(const [url,page,slug]of entries){
 // Release accumulated embedded media/GPU contexts during a full-site render.
 if(renderCount++>0&&renderCount%12===0){await p.close();p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await p.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===origin?route.continue():route.abort();});}
 const file=path.join(output,url.endsWith('/')?url.slice(1)+'index.html':url.slice(1));
 const legacy=fs.readFileSync(file,'utf8');
 await p.goto(origin+'/lab/atlas-ui/?page='+page+'&static=1'+(slug?'&slug='+encodeURIComponent(slug):''),{waitUntil:'domcontentloaded'});
 await p.locator('#content[aria-busy=false]').waitFor({timeout:30000});
 if((await p.locator('main').innerText()).includes('Preview could not load:'))throw Error('Failed canonical render: '+url+' '+await p.locator('main').innerText());
 // Shelves populate asynchronously from the shared registry; wait for their state.
 await p.waitForFunction(()=>[...document.querySelectorAll('[data-gumroad-shelf]')].every(s=>s.hidden||s.dataset.carouselReady==='true'));
 const record=posts.find(r=>r.slug===slug);const summary=revisions[slug]?.summary||record?.summary;
 const html=await p.evaluate(({legacy,page,slug,routes,summary,assetVersion})=>{
  const source=new DOMParser().parseFromString(legacy,'text/html'),doc=document.documentElement.cloneNode(true);
  const head=doc.querySelector('head');head.replaceChildren();
  for(const node of source.head.children){if(node.matches('title,meta,link[rel=canonical],link[rel=icon],link[rel=apple-touch-icon],script[type="application/ld+json"]'))head.append(node.cloneNode(true));}
  if(summary){for(const meta of head.querySelectorAll('meta[name=description],meta[property="og:description"],meta[name="twitter:description"]'))meta.content=summary;for(const script of head.querySelectorAll('script[type="application/ld+json"]')){const data=JSON.parse(script.textContent);if(data.description)data.description=summary;script.textContent=JSON.stringify(data).replaceAll('<','\\u003c');}}
  for(const file of ['tokens','shell','components','fixtures']){const link=document.createElement('link');link.rel='stylesheet';link.href='/ui/atlas/'+file+'.css?v='+assetVersion;head.append(link);}
  const boot=document.createElement('script');boot.type='module';boot.src='/ui/atlas/preview.js?v='+assetVersion;head.append(boot);
  const body=doc.querySelector('body');body.dataset.publicPage=page;if(slug)body.dataset.slug=slug;
  body.querySelectorAll('script,.review-bar,noscript').forEach(e=>e.remove());
  body.querySelector('.page-footer').innerHTML='<a href="/privacy/">Privacy</a>';
  body.querySelector('#content').setAttribute('aria-busy','false');
  for(const el of body.querySelectorAll('[data-ready],[data-carousel-ready],[data-store-populated]')){delete el.dataset.ready;delete el.dataset.carouselReady;delete el.dataset.storePopulated;}
  for(const image of body.querySelectorAll('img[src^="/lab/atlas-ui/"]'))image.setAttribute('src',image.getAttribute('src').replace('/lab/atlas-ui/','/ui/atlas/'));
  for(const a of body.querySelectorAll('a[href]')){const raw=a.getAttribute('href');if(raw.startsWith('?')){const params=new URLSearchParams(raw.split('#')[0]),key=params.get('page')+(params.get('slug')?':'+params.get('slug'):'');if(routes[key])a.setAttribute('href',routes[key]+(raw.includes('#')?'#'+raw.split('#')[1]:''));}else{const u=new URL(raw,location.origin);if(routes[u.pathname])a.setAttribute('href',routes[u.pathname]+u.hash);}}
  // Canvas images are regenerated by the same tool engine on the public page.
  doc.querySelectorAll('style').forEach(e=>e.remove());
  return '<!doctype html>\n'+doc.outerHTML;
 },{legacy,page,slug,routes,summary,assetVersion});
 fs.writeFileSync(file,html);console.log('CANONICAL '+url);
}
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
