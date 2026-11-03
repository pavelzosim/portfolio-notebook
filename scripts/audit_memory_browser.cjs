// Run after serving the source lab or canonical build. No external services.
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/pavel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const origin=process.argv[2]||'http://127.0.0.1:8766',publicMode=process.argv.includes('--public');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
 const page=await browser.newPage({viewport:{width:1573,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const ready=async()=>{if(publicMode){await page.waitForFunction(()=>['true','error'].includes(document.body.dataset.runtimeReady));assert.equal(await page.getAttribute('body','data-runtime-ready'),'true',(await page.locator('main').innerText()).slice(0,500));}else await page.locator('#content[aria-busy="false"]').waitFor();};
 const text=id=>page.locator('#layout-'+id).innerText();
 const span=async n=>assert.match(await text('summary'),new RegExp('Layout span / stride\\s+'+n.toLocaleString('en-US')+' B'));
 const source=async code=>{await page.getByRole('tab',{name:'HLSL declarations',exact:true}).click();await page.locator('#layout-source').fill(code);await page.locator('#layout-calculate').click();};
 try{
  await page.goto(origin+(publicMode?'/online-tools/shader-memory-layout/':'/lab/atlas-ui/?page=memory'));
  await ready();
  await page.locator('#layout-map svg').waitFor();await span(48);
  assert.equal(await page.locator('#layout-map .atlas-uml-diag').getAttribute('data-occupancy'),'50');
  assert.deepEqual(await page.locator('#layout-map [data-memory-row]').evaluateAll(rows=>rows.map(r=>r.dataset.density)),['sparse','dense','sparse']);
  assert.match(await text('packing'),/has not been checked/);
  await page.locator('#layout-suggest').click();assert.match(await text('packing'),/16 B saved/);assert.equal(await page.locator('#layout-map .atlas-uml-diag').getAttribute('data-occupancy'),'75');
  await source('float value;');await page.locator('#layout-suggest').click();assert.match(await text('packing'),/No smaller span exists among permutations of these top-level fields/);assert.equal(await page.locator('#layout-map [data-memory-row]').getAttribute('data-density'),'sparse');
  await page.locator('#layout-profile').selectOption('structured');assert.equal(await page.locator('#layout-map [data-memory-row]').getAttribute('data-occupancy'),'100');assert.equal(await page.locator('#layout-map [data-memory-row]').getAttribute('data-density'),'dense');
  await page.locator('#layout-profile').selectOption('cbuffer');await source(Array.from({length:9},(_,i)=>'float item'+i+';').join('\n'));await page.locator('#layout-suggest').click();assert.match(await text('packing'),/bounded search/);
  await page.getByRole('tab',{name:'Fields',exact:true}).click();await page.locator('#layout-examples').selectOption('padding');
  for(const [key,n]of Object.entries({lerp:32,saturate:16,smoothstep:16,dot:32,normalize:16,reflect:32,mul:80})){
   await page.locator('#layout-examples').selectOption(key);await span(n);assert(await page.locator('#layout-function').isVisible());
   assert.match(await text('function-code'),new RegExp('result = '+key+'\\('));assert.match(await page.locator('#layout-function-reference').getAttribute('href'),/learn.microsoft.com/);
  }
  await page.locator('#layout-examples').selectOption('lerp');await page.locator('#layout-profile').selectOption('structured');await span(28);
  assert.equal(await page.locator('#layout-examples').inputValue(),'lerp');
  await page.locator('#layout-profile').selectOption('cbuffer');await page.locator('#layout-suggest').click();assert(await page.locator('#layout-function').isVisible());
  const functionPending=page.waitForEvent('download');await page.locator('#layout-export').click();const functionDownload=await functionPending;
  const functionReport=JSON.parse(await fs.readFile(await functionDownload.path(),'utf8'));assert.equal(functionReport.functionExample.resultType,'float3');assert.equal(functionReport.layout.payload,28);assert.equal(functionReport.layout.rows.length,3);
  await page.getByRole('textbox',{name:'Field 1 name',exact:true}).fill('changedColor');assert.equal(await page.locator('#layout-examples').inputValue(),'custom');assert(await page.locator('#layout-function').isHidden());
  await page.locator('#layout-examples').selectOption('normalize');await page.getByRole('combobox',{name:'Field 1 type',exact:true}).selectOption('float4');assert(await page.locator('#layout-function').isHidden());
  await page.locator('#layout-examples').selectOption('lerp');await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#layout-function').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/memory-function-mobile.png'});
  await page.setViewportSize({width:1573,height:1000});await page.locator('#layout-function').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/memory-function-desktop.png'});
  await page.locator('#layout-examples').selectOption('padding');assert(await page.locator('#layout-function').isHidden());
  await page.locator('#layout-suggest').click();await span(32);assert.match(await text('comparison'),/16 B saved/);
  assert.equal(await page.locator('#layout-source').inputValue(),'float gain;\nfloat4 tint;\nfloat bias;');
  await page.locator('#layout-use').click();await span(32);assert.notEqual(await page.locator('#layout-source').inputValue(),'float gain;\nfloat4 tint;\nfloat bias;');
  await page.getByRole('tab',{name:'Fields',exact:true}).click();await page.getByRole('textbox',{name:'Field 1 name',exact:true}).fill('exposure');
  assert.match(await page.locator('#layout-source').inputValue(),/exposure/);await span(32);
  await source('float weights[4]; float3 tint;');await span(64);assert.match(await text('offsets'),/52/);
  await page.locator('#layout-byte').fill('4');assert.match(await text('detail'),/padding/);
  await page.locator('#layout-byte').fill('52');assert.match(await text('detail'),/tint.x/);
  await page.locator('#layout-profile').selectOption('structured');await span(28);
  await page.locator('#layout-profile').selectOption('cbuffer');await page.locator('#layout-examples').selectOption('half');await span(32);
  await page.locator('#layout-native16').check();await span(16);
  await page.locator('#layout-native16').uncheck();await page.locator('#layout-examples').selectOption('matrix');await span(32);
  await page.locator('#layout-major').selectOption('row_major');await span(48);assert.match(await page.locator('#layout-export-code').textContent(),/row_major float3x2/);
  await source('float4 main() { return 0; }');assert.equal(await page.locator('#layout-map svg').count(),0);assert.equal(await page.locator('#layout-packing').textContent(),'');assert(await page.locator('#layout-export').isDisabled());assert.match(await text('status'),/Expected/);
  await source('float4 samples[128];');await span(2048);assert.match(await text('page'),/1 \/ 8/);await page.locator('#layout-next').click();assert.match(await text('page'),/2 \/ 8/);
  await page.locator('#layout-count').fill('0');assert(await page.locator('#layout-export').isDisabled());
  await page.locator('#layout-calculate').click();assert.match(await text('status'),/Repetitions must/);
  await page.locator('#layout-count').fill('10');await span(2048);
  const pending=page.waitForEvent('download');await page.locator('#layout-export').click();const download=await pending;
  assert.equal(await download.failure(),null);const report=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  assert.equal(report.layout.span,2048);assert.equal(report.repetitions,10);assert.equal(report.repeatedSpan,20480);assert.match(report.declarations,/samples\[128\]/);
  await source('float gain; /* <img src=x onerror="window.__unsafe=1"> */');await span(16);assert.equal(await page.evaluate(()=>window.__unsafe),undefined);
  await page.getByRole('tab',{name:'Fields',exact:true}).click();await page.getByRole('tab',{name:'Fields',exact:true}).press('ArrowRight');
  assert.equal(await page.getByRole('tab',{name:'HLSL declarations',exact:true}).getAttribute('aria-selected'),'true');
  await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#memory-inspection').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/memory-mobile.png'});
  await page.setViewportSize({width:1573,height:1000});await page.locator('#layout-examples').selectOption('padding');
  await page.locator('#memory-inspection').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/memory-desktop.png'});
  await page.goto(origin+(publicMode?'/online-tools/':'/lab/atlas-ui/?page=index'));await page.locator('a.tool-catalog-card').filter({hasText:'Shader Memory Layout'}).waitFor();
  await ready();
  assert.equal(await page.locator('a.tool-catalog-card').count(),8);
  assert.match(await page.locator('a.tool-catalog-card').filter({hasText:'Shader Memory Layout'}).innerText(),/v1.0/);
  await page.goto(origin+(publicMode?'/':'/lab/atlas-ui/?page=home'));
  await ready();
  await page.locator('[data-home-tools-slider][data-ready="true"]').waitFor();
  const slider=page.locator('[data-home-tools-slider]').first();assert.equal(await slider.locator('.browser-tool-feature').count(),8);
  for(let i=0;i<7;i++)await slider.locator('[data-home-tools-next]').click();
  assert.match(await slider.locator('.browser-tool-feature:visible').innerText(),/Shader Memory Layout/);
  assert.match(await slider.locator('.browser-tool-feature:visible figcaption').innerText(),/JSON \/ HLSL/);
  assert.match(await slider.locator('.browser-tool-feature:visible .browser-tool-state').innerText(),/BROWSER TOOL \/ FREE/);
  assert.match(await slider.locator('.browser-tool-feature:visible .browser-tool-copy>p:not(.browser-tool-state)').innerText(),/HLSL buffer offsets/);
  if(!publicMode){await page.goto(origin+'/lab/atlas-ui/?page=components');await page.locator('#content[aria-busy="false"]').waitFor();assert.equal(await page.locator('#diagram [data-byte]').count(),48);}
  assert.deepEqual(errors,[]);console.log('PASS memory calculator: input modes, profiles, precision, matrix export, errors, byte inspection, pagination, reorder, JSON, keyboard, mobile and catalogue.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
