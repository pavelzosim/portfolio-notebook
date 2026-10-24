const {chromium}=require('C:/Users/pavel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8766/lab/atlas-ui/?page=components');
 const inventory=await p.evaluate(async()=>({posts:(await(await fetch('/content/posts/index.json')).json()).records.filter(r=>r.state==='published'&&r.indexable!==false),projects:(await(await fetch('/content/projects/index.json')).json()).projects}));
 const routes=[...['review','home','index','tools','projects','blog','components','tool','compressor','noise','privacy','notfound'].map(page=>'?page='+page),...inventory.posts.map(r=>'?page=article&slug='+encodeURIComponent(r.slug)),...inventory.projects.map(r=>'?page=project&slug='+encodeURIComponent(r.slug))];
 const results=[];
 for(const route of routes){const start=errors.length;await p.goto('http://127.0.0.1:8766/lab/atlas-ui/'+route,{waitUntil:'domcontentloaded'});await p.waitForSelector('#content[aria-busy=false]');const data={route,h1:await p.locator('main h1').count(),loadError:(await p.locator('main').textContent()).includes('Preview could not load:'),overflow:[],errors:errors.slice(start)};
 if(route.startsWith('?page=article&')){
  const record=inventory.posts.find(r=>route.endsWith(encodeURIComponent(r.slug)));
  const missing=await p.evaluate(async path=>{
   const source=new DOMParser().parseFromString(await(await fetch(path)).text(),'text/html');const original=source.querySelector('.atlas-container')||source;const body=document.querySelector('main .article-body');
   const media=new Set([...body.querySelectorAll('img')].map(e=>e.getAttribute('src'))),codes=[...body.querySelectorAll('pre')].map(e=>e.textContent.trim());
   const frames=[...body.querySelectorAll('iframe')];
   const evidenceSvg=root=>[...root.querySelectorAll('svg')].filter(svg=>!svg.closest('pre,code,button,[data-slider],[data-image-slider]'));
   const diagrams=evidenceSvg(original).length>evidenceSvg(body).length;
   const missingFrames=[...original.querySelectorAll('iframe')].filter(frame=>!frames.some(rendered=>rendered.getAttribute('src')===frame.getAttribute('src'))).length;
   const smallFrames=frames.filter(frame=>frame.closest('.atlas-interactive-frame')&&frame.clientHeight<300).length;
   const diagramNodes=[...original.querySelectorAll('.atlas-uml-diag__node-title')].filter(node=>!body.textContent.includes(node.textContent.trim())).length;
   const selector='[data-slider],[data-image-slider],.gallery-grid';
   const expectedGalleries=[...original.querySelectorAll(selector)].filter(host=>host.querySelector('img')&&!host.parentElement.closest(selector)).length;
   const sliders=[...body.querySelectorAll('.project-slider')];
   const galleries=body.querySelectorAll(selector).length>0||sliders.length!==expectedGalleries;
   const brokenSliders=sliders.filter(slider=>{const count=slider.querySelectorAll('.project-media').length;slider.querySelector('[data-next]').click();const next=slider.querySelector('output').textContent;slider.querySelector('[data-prev]').click();return next!==`${count>1?2:1} / ${count}`||slider.querySelectorAll('.project-media[aria-hidden=false]').length!==1;}).length;
   return {headings:original.querySelectorAll('h2').length!==body.querySelectorAll('h2').length,images:[...original.querySelectorAll('img')].map(e=>e.getAttribute('src')).filter(src=>!media.has(src)),code:[...original.querySelectorAll('pre')].map(e=>e.textContent.trim()).filter(text=>!codes.includes(text)).length,diagrams,missingFrames,smallFrames,diagramNodes,galleries,brokenSliders};
  },record.localPath);
  if(missing.headings||missing.images.length||missing.code||missing.diagrams||missing.missingFrames||missing.smallFrames||missing.diagramNodes||missing.galleries||missing.brokenSliders)data.errors.push('Content integrity: '+JSON.stringify(missing));
 }
 if(route.startsWith('?page=project&')){
  const record=inventory.projects.find(r=>route.endsWith(encodeURIComponent(r.slug)));
  const expected=[...(record.media||[]),...(record.locationMedia||[]),...(record.mediaGalleries||[]).flatMap(group=>group.media||[])].map(image=>image.src);
  const rendered=await p.locator('main .media-tabs img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
  const missing=expected.filter(src=>!rendered.includes(src));if(missing.length)data.errors.push('Missing project images: '+missing.join(', '));
 }
 for(const width of [1440,390]){await p.setViewportSize({width,height:900});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))data.overflow.push(width);}
 data.errors.push(...errors.slice(start).filter(error=>!data.errors.includes(error)));results.push(data);console.log(data.loadError||data.h1!==1||data.overflow.length||data.errors.length?'FAIL':'PASS',route,data.overflow.join(','));}
 const failed=results.filter(r=>r.loadError||r.h1!==1||r.overflow.length||r.errors.length);console.log(JSON.stringify({total:results.length,failed},null,2));
 if(failed.length)process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.log(e.message);process.exitCode=1});
