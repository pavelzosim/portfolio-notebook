const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/pavel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const origin=process.argv[2]||'http://127.0.0.1:8766',publicMode=process.argv.includes('--public');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})}),page=await browser.newPage({viewport:{width:1573,height:1100},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const ready=()=>page.locator('#function-to-pixel[data-ready="true"]').waitFor(),input=name=>page.locator('#ray-settings [name="'+name+'"]');
 const coord=async(x,y)=>{await page.locator('#ray-x').fill(String(x));await page.locator('#ray-y').fill(String(y));await page.locator('#ray-y').dispatchEvent('change');};
 try{
  await page.goto(origin+(publicMode?'/online-tools/shader-memory-layout/':'/lab/atlas-ui/?page=memory')+'#function-to-pixel');await ready();
  assert.equal(await page.locator('#function-to-pixel [id^="ray-download"]').count(),0);assert.equal(await page.locator('#function-to-pixel a[download]').count(),0);assert.match(await page.locator('#function-to-pixel').innerText(),/Float32 prediction/);
  assert.match(await page.locator('#ray-result').innerText(),/hit · 2 march SDF calls \+ 6 normal calls = 8/);
  await page.locator('#ray-next').click();assert.equal(await page.locator('#ray-step').inputValue(),'1');assert(await page.locator('#ray-next').isDisabled());
  assert.match(await page.locator('#ray-values').innerText(),/Float32 comparison for this sample/);
  await page.locator('[data-ray-value="hitTest"]').click();assert.match(await page.locator('#ray-code-body [data-current-line]').innerText(),/if \(d < hitEpsilon\)/);await page.getByRole('tab',{name:'Values & lifetimes',exact:true}).click();
  await page.locator('[data-ray-value="p"]').click();assert.equal(await page.locator('#tab-ray-code-panel').getAttribute('aria-selected'),'true');assert.match(await page.locator('#ray-code-body [data-current-line]').innerText(),/float3 p/);
  await page.locator('[data-ray-stage="normal"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#ray-values').innerText(),/Normalized gradient/);
  await coord(0,0);assert.match(await page.locator('#ray-result').innerText(),/distance-limit/);
  await page.locator('[data-ray-stage="normal"]').click();assert.match(await page.locator('#ray-values').innerText(),/Skipped/);await page.getByRole('tab',{name:'HLSL function',exact:true}).click();assert.equal(await page.locator('#ray-code-body [data-current-line]').count(),0);
  await page.locator('#ray-image').focus();await page.keyboard.press('Home');assert.match(await page.locator('#ray-result').innerText(),/hit/);await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#ray-x').inputValue(),'97');
  await input('maxSteps').fill('1');await ready();assert.match(await page.locator('#ray-result').innerText(),/step-limit · 1 march SDF calls \+ 0 normal/);
  await input('maxSteps').fill('64');await input('maxDistance').fill('1');await ready();assert.match(await page.locator('#ray-result').innerText(),/distance-limit · 1 march/);
  await input('radius').fill('2');await page.waitForFunction(()=>document.querySelector('#ray-status').getAttribute('role')==='alert');assert(await page.locator('#ray-next').isDisabled());
  await input('radius').fill('1');await input('maxDistance').fill('20');await input('frame').selectOption('256x144');await ready();assert.equal(await page.locator('#ray-x').getAttribute('max'),'255');assert.equal(await page.locator('#ray-y').getAttribute('max'),'143');
  const box=await page.locator('#ray-image').boundingBox(),scale=Math.min(box.width/256,box.height/144),top=(box.height-144*scale)/2;
  await page.locator('#ray-image').click({position:{x:128.5*scale,y:top+72.5*scale}});assert.equal(await page.locator('#ray-x').inputValue(),'128');assert.equal(await page.locator('#ray-y').inputValue(),'72');
  await page.locator('#ray-image').click({position:{x:box.width/2,y:5}});assert.equal(await page.locator('#ray-y').inputValue(),'72');
  const before=await page.locator('#ray-result').innerText();await input('exposure').fill('2');await ready();const after=await page.locator('#ray-result').innerText();assert.notEqual(after.match(/#[a-f0-9]{6}/)[0],before.match(/#[a-f0-9]{6}/)[0]);assert.equal(after.split(' · final RGB')[0],before.split(' · final RGB')[0]);
  await page.getByRole('tab',{name:'Parameter buffer',exact:true}).click();assert.match(await page.locator('#ray-buffer').innerText(),/84 B of fields, 96 B rounded layout span/);assert.match(await page.locator('#ray-buffer-values').innerText(),/maxSteps · 24/);
  const hlsl=await page.locator('#ray-full-source').textContent();assert.match(hlsl,/float4 VSMain/);assert.match(hlsl,/float4 PSMain/);
  await page.locator('[data-ray-param="sphereRadius"]').click();assert.equal(await page.locator('#ray-buffer-map [fill="var(--selected)"]').count(),4);
  await page.locator('#ray-open-buffer').click();assert.equal(await page.locator('#tab-buffer-layout').getAttribute('aria-selected'),'true');assert.match(await page.locator('#layout-summary').innerText(),/96 B/);assert.equal(await page.locator('#layout-inspect-field').inputValue(),'sphereRadius');
  await page.locator('#tab-buffer-layout').press('ArrowRight');assert.equal(await page.locator('#tab-function-to-pixel').getAttribute('aria-selected'),'true');
  await page.getByRole('tab',{name:'Values & lifetimes',exact:true}).click();await page.getByRole('tab',{name:'Values & lifetimes',exact:true}).press('ArrowRight');assert.equal(await page.locator('#tab-function-to-pixel').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#tab-ray-code-panel').getAttribute('aria-selected'),'true');
  await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#ray-pixel-inspection').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/raymarch-mobile.png'});
  await page.getByRole('tab',{name:'Parameter buffer',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS raymarch: float32 prediction, no study exports, input/color response, pixel picking, keyboard, exits, invalid settings, linked views, parameter layout and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
