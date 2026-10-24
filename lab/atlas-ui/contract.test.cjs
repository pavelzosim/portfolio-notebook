const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
test('artwork media faces belong to shared components, not fixture overrides',()=>{
 const shared=read('components.css'),fixtures=read('fixtures.css');
 for(const selector of ['.project-media{','.project-media img{','.project-media video{','.project-media figcaption{','.project-slider-nav{']){
  assert(shared.includes(selector),selector);
  assert(!fixtures.includes(selector),'fixture duplicate '+selector);
 }
 assert(read('project.js').includes('artworkGallery(themes,escape)'));
 assert(read('style-guide.js').includes("add('artwork-tabs'"));
});
test('store products derive from the tool registry, not a URL allowlist',()=>{
 const shelf=read('shelf-carousel.js');
 assert(shelf.includes("fetch('/content/posts/index.json')"));
 assert(shelf.includes("r.kind==='tool'&&r.resource&&r.state==='published'"));
 assert(shelf.includes("source.querySelectorAll('.atlas-download-btn[href]')"));
 assert(!shelf.includes('const storeTools=new Set'));
 assert(shelf.includes('shelf.dataset.catalogueLimit'));
});
test('noise catalogue is one shared preview pair, not another tool',()=>{
 const guide=read('style-guide.js'),specimen=read('noise-preview-specimen.js');
 assert(guide.includes("add('noise-preview'"));
 assert(guide.includes("querySelector('.noise-views').cloneNode(true)"));
 assert(specimen.includes("import('/scripts/noise-generator-core.js?v=2')"));
 assert(specimen.includes('window.NoiseMaterialPreview'));
 assert(!specimen.includes('noise-generator-tool.js'));
});
test('article passport and share use the catalogue implementation',()=>{
 const preview=read('preview.js'),guide=read('style-guide.js');
 assert.match(preview,/renderArticlePassport\(head,record\)/);
 assert.match(preview,/createShareSection\(record.publicUrl\|\|record.sourceUrl\)/);
 assert.match(guide,/replaceWith\(createShareSection\(/);
 assert(!preview.includes('const metadata='),'no intermediate passport implementation before the shared renderer');
});
test('Style Guide documents the shared implementation rather than a second stylesheet',()=>{
 const guide=read('components.html'),preview=read('preview.js'),fixtures=read('fixtures.css');
 for(const id of ['contract','tokens','actions','fields','states','panels','extension'])assert(guide.includes(`id="${id}"`),id);
 assert.match(preview,/getComputedStyle\(document.documentElement\)/);
 assert.match(preview,/createControlDisclosure\('Settings'\)/);
 const catalogue=read('style-guide.js');
 assert.match(catalogue,/const order=\['actions','fields','panels'/);
 assert.match(catalogue,/register.replaceWith\(palette\)/);
 for(const id of ['comparison','math','tables','diagram','article-header','article-footer','share','discovery'])assert(catalogue.includes(`add('${id}'`),id);
 assert.match(catalogue,/language-c/);
 assert.match(catalogue,/renderArticlePassport/);
 assert.match(read('components.css'),/accent-color:var\(--blue\)/);
 assert(!preview.includes("patterns=article.querySelector('.guide-document')"),'do not embed an unadapted legacy page');
 assert(!/\[data-template="noise"\] #noise-status\{/.test(fixtures));
 assert(!/\.browser-tools-nav button\{/.test(fixtures));
 assert.equal((read('components.css').match(/\.control-panel--columns\{/g)||[]).length,2,'one base definition and one standalone responsive definition; mobile selector is grouped');
});
test('catalogue examples are components, not duplicate page actions',()=>{
 const html=read('components.html'),guide=read('style-guide.js');
 assert(!html.includes('Validate settings'));
 assert(!guide.includes("add('intro-profile'"));
 assert(!guide.includes("add('slider'"));
 assert(!guide.includes('guide-latest'));
 assert(!guide.includes('— review candidate'));
 assert(guide.includes("add('artwork-tabs'"));
 assert(guide.includes('above the Record rows component'));
 assert.match(html,/new label does not create a new button style/);
});
test('branch site uses registry-selected articles/projects and shared routes',()=>{
 const routes=read('site-routes.js'),preview=read('preview.js');
 assert(routes.includes("'?page=article&slug='"));
 assert(routes.includes("'?page=project&slug='"));
 assert(routes.includes('MutationObserver'));
 assert(preview.includes('site.records.find(r=>r.slug===slug)'));
 assert(preview.includes('layouts[selectedSlug]||{}'));
 assert(preview.includes('site.observe(main)'));
 assert(read('article-adapter.js').includes('mediaSlider('));
});
test('preview is noindex, outside deployment allowlist, and loads only candidate CSS',()=>{
 const html=read('index.html');
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 const sheets=[...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(sheets.map(s=>s.split('?')[0]),['./tokens.css','./shell.css','./components.css','./fixtures.css']);
 assert(sheets.every(s=>/\?v=review-\d+$/.test(s)));
 const builder=fs.readFileSync(path.join(__dirname,'../../scripts/build_github_pages.py'),'utf8');
 assert(!builder.match(/SITE_DIRECTORIES\s*=\s*\([^\n]*["']lab["']/));
 assert(!html.includes('analytics'));
});
test('candidate modules do not import legacy CSS or force declarations',()=>{
 for(const file of ['tokens.css','shell.css','components.css','fixtures.css']){
  const css=read(file);assert(!css.includes('!important'),file);
  assert(!/@import(?![^;]*fonts\.googleapis\.com)/.test(css),file);
 }
});
test('shell geometry and interaction faces have separate single owners',()=>{
 const shell=read('shell.css'),components=read('components.css'),fixtures=read('fixtures.css');
 assert.match(shell,/\.workspace\{/);assert.match(components,/\.atlas-btn,\.button\{/);
 assert(!/\.workspace\s*\{|\.shell\s*\{|\.commander\s*\{|\.atlas-btn\s*\{/.test(fixtures));
 assert.match(shell,/prefers-reduced-motion/);
 assert.match(read('tokens.css'),/--left:220px;--right:200px/);
});
