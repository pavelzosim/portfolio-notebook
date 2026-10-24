/* Local comparison harness. Only source content is imported, never its CSS/scripts. */
import {setupNavigation} from './navigation.js?v=review-22';
import {setupHomeInteractions} from './home.js?v=review-107';
import {renderTools} from './tools.js?v=review-137';
import {renderBlog} from './blog.js?v=review-118';
import {renderProject} from './project.js?v=review-148';
import {setupCompressorPanel} from './compressor-panel.js?v=review-126';
import {setupNoisePanel,setupNoisePresets} from './noise-panel.js?v=review-131';
import {createControlDisclosure} from './control-disclosure.js?v=review-84';
import {setupShelfCarousels} from './shelf-carousel.js?v=review-137';
import {renderRecordPreviews} from './record-preview.js?v=review-148';
import {setupProductLists} from './product-list.js?v=review-108';
import {setupToolCatalog} from './tool-catalog.js?v=review-111';
import {renderProjectCards} from './project-card.js?v=review-114';
import {createShareSection} from './share-controls.js?v=review-119';
import {createToolFeedback} from './tool-feedback.js?v=review-128';
import {setupArticleNavigation} from './article-navigation.js?v=review-120';
import {setupSpritePanel} from './sprite-panel.js?v=review-122';
import {renderArticlePassport} from './article-passport.js?v=review-91';
import {completeStyleGuide} from './style-guide.js?v=review-148';
import {createSiteRoutes} from './site-routes.js?v=review-141';
import {adaptArticle,extractArticleBody,enhanceArticle} from './article-adapter.js?v=review-149';
import {renderSiteReview} from './site-review.js?v=review-145';
let site;
async function review(){renderSiteReview({main,left,right,site,heading,section,escape});}
async function notfound(){main.innerHTML=heading('404 · Path not in this notebook','site / not found','The existing notebook game is preserved in an isolated interactive frame.')+'<div class="article-body"><figure class="media-frame"><iframe src="/404.html" title="404 notebook game" loading="lazy"></iframe><figcaption class="media-caption">Original notebook game · keyboard and pointer controls remain inside the frame.</figcaption></figure><p><a href="?page=home">Return home →</a></p></div>';outline('404.md',[['?page=home','Home']]);right.replaceChildren();}
const pages={home:'/',index:'/online-tools/',tools:'/tools/',projects:'/projects/',blog:'/blog/',article:'/content/posts/atlas-html/procedural-travel-resolution.html',project:'/projects/nasa-first-woman/',tool:'/online-tools/sprite-sheet-assembly/',compressor:'/online-tools/image-compressor/',noise:'/online-tools/noise-generator/',components:'/blog/style-guide/',privacy:'/privacy/',notfound:'/404.html',review:'/'};
const page=Object.hasOwn(pages,new URLSearchParams(location.search).get('page'))?new URLSearchParams(location.search).get('page'):'home';
const main=document.querySelector('#content'),left=document.querySelector('#outline'),right=document.querySelector('#passport');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=async url=>{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error(`${url}: ${response.status}`);return response;};
const doc=async url=>new DOMParser().parseFromString(await(await get(url)).text(),'text/html');
const json=async url=>(await get(url)).json();
const heading=(title,context,summary)=>`<header class="document-head"><p class="breadcrumb">${escape(context)}</p><h1>${escape(title)}</h1>${summary?`<p>${escape(summary)}</p>`:''}</header>`;
const section=(id,title,html)=>`<section class="document-section" id="${id}"><header class="section-label"><span>§</span><h2>${escape(title)}</h2></header>${html}</section>`;
const facts=(label,entries)=>`<div class="meta-block"><p>${escape(label)}</p><dl>${entries.map(([k,v])=>`<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl></div>`;
const outline=(label,entries,start=0)=>{left.innerHTML=`<p class="rail-title">${escape(label)}</p><nav>${entries.map(([href,title],i)=>`<a href="${href}">${String(i+start).padStart(2,'0')} ${escape(title.replace(/^\d+\s+/,''))}</a>`).join('')}</nav>`;};
const loadScript=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.append(el);});
function clean(element){element.querySelectorAll('script,style,link').forEach(e=>e.remove());element.querySelectorAll('[style]').forEach(e=>e.removeAttribute('style'));return element;}
function sourceRail(source){const rail=source.querySelector('.meta-rail');if(rail)right.replaceChildren(...clean(rail).childNodes);right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});}
function localToolLinks(root){root.querySelectorAll('a[href="/online-tools/sprite-sheet-assembly/"]').forEach(a=>a.href='?page=tool');}
function shelves(){setupShelfCarousels(document);}
async function home(){
 const source=await doc('/');
 main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 main.querySelector('#overview')?.classList.add('intro-profile');
 main.querySelectorAll('.doc-section,.doc-head').forEach(el=>{el.classList.remove('doc-section','doc-head');el.classList.add('document-section');});
 main.querySelectorAll('div.record-list').forEach(el=>{el.classList.remove('record-list');el.classList.add('home-records');});
 setupProductLists(main);
 const entries=[...source.querySelectorAll('.rail>ol a')].map(a=>[a.getAttribute('href'),a.querySelector('b').textContent]);
 outline('CONTENTS.md',entries,1);
 const wire=source.querySelector('.wire-block');if(wire)left.prepend(clean(wire));
 const contacts=source.querySelector('.rail-links');if(contacts)left.append(clean(contacts));
 sourceRail(source);localToolLinks(main);localToolLinks(right);shelves();
 await loadScript('/scripts/post-registry.js?v=2');
 // Renderers contain content selection only; no legacy styles or shell handlers.
 const ready=type=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`${type}: registry render timed out`)),10000);document.addEventListener(type,()=>{clearTimeout(timer);resolve();},{once:true});});
 const rendered=Promise.all([ready('homepage:records-ready'),ready('tools:records-ready')]);
 await loadScript('/scripts/home-content.js?v=9');
 await loadScript('/scripts/tools-content.js?v=7');
 const registry=await window.atlasFetchRegistry('/content/posts/index.json');
 await rendered;
 renderRecordPreviews(main.querySelector('[data-home-highlights]'),registry.records.filter(r=>r.homepage?.highlight).sort((a,b)=>(a.homepage.rank??0)-(b.homepage.rank??0)));
 await loadScript('./wireframe-shape.js?v=review-104');
 setupHomeInteractions(main,registry.records);
}
async function index(){
 const [source,registry]=await Promise.all([doc(pages.index),json('/content/online-tools/index.json')]);
 const records=registry.records.filter(record=>record.state==='published'&&record.indexable!==false);
 main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 setupToolCatalog(main,records);
 localToolLinks(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],...records.map(record=>[`?page=${({'sprite-sheet-assembly':'tool','image-compressor':'compressor','noise-generator':'noise'})[record.slug]}`,record.title.replace(/ Tool$| for Technical Artists$/g,'')])]);
 const links=[...left.querySelectorAll('nav a')];records.forEach((record,i)=>{links[i+1].textContent=`${record.id.split('-').at(-1).replace(/^0/,'')} ${record.title.replace(/ Tool$| for Technical Artists$/g,'')}`;});
 const homeSource=await doc('/');
 const store=homeSource.querySelector('[data-gumroad-shelf]');
 if(!store)throw new Error('The approved Home Tool Store is unavailable.');
 right.replaceChildren(clean(store));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});
 shelves();
 main.querySelector('.section-label em').textContent=`${String(records.length).padStart(2,'0')} LIVE TOOLS`;
}
async function article(){const source=await doc(pages.article),record=site.records.find(r=>r.localPath===pages.article);main.innerHTML=heading(record.title,'blog / '+record.group,record.summary);const body=extractArticleBody(source);adaptArticle(body,escape);main.append(body);const used=new Set();body.querySelectorAll('h2,h3,h4').forEach((h,i)=>{let id=h.id||'section-'+(i+1);while(used.has(id))id+='-'+(i+1);h.id=id;used.add(id);});const entries=[...body.querySelectorAll('h2[id]')].map(h=>['#'+h.id,h.textContent]);outline('ARTICLE.md',entries,entries[0]?.[1].toLowerCase().includes('overview')?0:1);void enhanceArticle(source,body);}
async function project(){} // The shared registry renderer below owns all project pages.
async function restoreArticleElements(){
 const registry=await json('/content/posts/index.json');
 const record=registry.records.find(r=>r.localPath===pages.article);
 const related=registry.records.filter(r=>r.id!==record.id&&r.group===record.group&&r.state==='published'&&r.indexable!==false).sort((a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0));
 right.innerHTML=facts('[RECORD]',[['kind',record.kind],['topic',record.group]])+`<div class="meta-block article-related"><p>[RELATED / ${escape(record.group.toUpperCase())}]</p><ul>${related.map(r=>`<li><a href="${escape(r.localPath||r.publicUrl||r.sourceUrl)}">${escape(r.title)}</a></li>`).join('')}</ul></div>`;
 const head=main.querySelector('.document-head');renderArticlePassport(head,record);
 const share=createShareSection(record.publicUrl||record.sourceUrl);
 main.querySelector('.article-body').append(share);
 main.querySelectorAll('.media-caption a').forEach(a=>{if(a.textContent.trim()==='Watch on YouTube'){const after=a.nextSibling;if(after?.nodeType===Node.TEXT_NODE&&after.textContent.trim()==='.')after.remove();a.remove();}});
 main.querySelectorAll('.article-body>h2').forEach((h,index)=>{
  if(index){
   const previous=h.previousElementSibling;if(previous?.classList.contains('atlas-section-break'))previous.remove();
   const divider=document.createElement('div');divider.className='article-section-divider';divider.setAttribute('aria-hidden','true');divider.innerHTML=`<span>// § ${String(index).padStart(2,'0')}</span>`;h.before(divider);
  }
  const mark=document.createElement('span');mark.className='article-section-mark';mark.setAttribute('aria-hidden','true');mark.textContent='§ ';h.prepend(mark);
 });
 const lastDivider=document.createElement('div');lastDivider.className='article-section-divider';lastDivider.setAttribute('aria-hidden','true');lastDivider.innerHTML=`<span>// § ${String(main.querySelectorAll('.article-body>h2').length).padStart(2,'0')}</span>`;
 const endOfText=main.querySelector('.article-body>.atlas-table-frame:has(.atlas-ref-list)')||main.querySelector('.article-body>.atlas-eof-divider');
 if(endOfText)endOfText.before(lastDivider);
 main.querySelectorAll('.article-body>h3,.article-body>h4').forEach(h=>{
  const mark=document.createElement('span');mark.className='article-subheading-mark';mark.setAttribute('aria-hidden','true');mark.textContent='> ';h.prepend(mark);
 });
 setupArticleNavigation(main);
}
async function tool(){const source=await doc(pages.tool);main.replaceChildren(...clean(source.querySelector('main')).childNodes);setupSpritePanel(main);outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['?page=compressor','Image Compressor'],['?page=noise','Noise Generator']]);sourceRail(source);await loadScript('/scripts/sprite-sheet-core.js?v=1');await loadScript('/scripts/sprite-sheet-tool.js?v=10');}
async function privacy(){
 const source=await doc(pages.privacy),content=clean(source.querySelector('main'));const title=content.querySelector('h1')?.textContent||'Privacy';content.querySelector('h1')?.remove();main.innerHTML=heading(title,'site / privacy','');const body=document.createElement('div');body.className='article-body';body.append(...content.childNodes);main.append(body);outline('PRIVACY.md',[['?page=home','Home']]);right.replaceChildren();
}
async function compressor(){
 const source=await doc(pages.compressor);main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 setupCompressorPanel(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['?page=compressor','Image Compressor'],['?page=noise','Noise Generator']]);sourceRail(source);
 renderToolInstructions(['Add up to 10 images.','Choose a preset or set format, quality and dimensions.','Process the batch.','Compare source and output; inspect channels and alpha.','Download the selected image or batch ZIP.']);
 main.querySelector('.tool-workflow')?.remove();main.querySelector('.tool-support')?.remove();
 await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/image-compressor-tool.js?v=3');
}
async function noise(){
 const source=await doc(pages.noise);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);
 setupNoisePanel(main);
 renderToolInstructions(['Choose a surface preset.','Tune the structure and normal settings.','Generate the preview.','Inspect the texture on the sphere or tiled plane; adjust the light.','Choose a resolution and download a PNG or all maps as ZIP.']);
 const explanation=[...main.querySelectorAll('.tool-section>p')].find(p=>p.textContent.startsWith('Choose a preset, tune the structure,'));
 if(explanation)explanation.textContent=explanation.textContent.replace(/^Choose a preset, tune the structure, then inspect it on the sphere or tiled plane\.\s*/,'');
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['?page=compressor','Image Compressor'],['?page=noise','Noise Generator']]);
 main.querySelectorAll('.noise-note').forEach(p=>{const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';p.before(note);note.append(p);});
 await loadScript('/scripts/noise-generator-core.js?v=2');setupNoisePresets(window.NoiseGeneratorCore,main);await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/noise-material-preview.js?v=2');await loadScript('/scripts/noise-generator-tool.js?v=3');
}
function renderToolInstructions(steps){
 const help=document.createElement('div');help.className='meta-block tool-instructions';
 const heading=document.createElement('p');heading.textContent='[HOW TO USE]';const list=document.createElement('ol');
 for(const text of steps){const item=document.createElement('li');item.textContent=text;list.append(item);}help.append(heading,list);right.append(help);
}
async function toolAfterword(){
 renderToolSupport();
 const records=(await json('/content/online-tools/index.json')).records.filter(r=>r.state==='published'&&r.indexable!==false),current=records.find(r=>r.slug===({compressor:'image-compressor',noise:'noise-generator',tool:'sprite-sheet-assembly'}[page]));
 const url=encodeURIComponent(current.publicUrl),title=encodeURIComponent(current.title);
 main.insertAdjacentHTML('beforeend',section('share','Share',`<div class="article-share tool-share"><div class="article-share-header">[SHARE]</div><div class="article-share-body"><nav aria-label="Share tool"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener noreferrer">[linkedin]</a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener noreferrer">[facebook]</a><a href="https://twitter.com/intent/tweet?url=${url}&amp;text=${title}" target="_blank" rel="noopener noreferrer">[twitter]</a></nav></div></div>`));
 main.querySelector('#share>.section-label').remove();
 const feedback=createToolFeedback();feedback.id='tool-feedback';main.querySelector('#share').append(feedback);
 const others=records.filter(r=>r.id!==current.id);
 main.insertAdjacentHTML('beforeend',section('other-tools','Other online tools',`<div class="tool-related-grid">${others.map(r=>`<a class="tool-related-card" href="${escape(r.localPath)}" aria-labelledby="related-${escape(r.id)}"><img src="${escape(r.image)}" alt="${escape(r.imageAlt||r.title)}" loading="lazy"><div><span class="eyebrow">${escape(r.id)}</span><h3 id="related-${escape(r.id)}">${escape(r.title)}</h3><p>${escape(r.summary)}</p><span class="record-arrow" aria-hidden="true">open →</span></div></a>`).join('')}</div>`));
}
function renderToolSupport(){
 right.querySelectorAll('.meta-block').forEach(block=>{if(block.querySelector('p')?.textContent.trim()==='[SUPPORT]')block.remove();});
 const support=document.createElement('div');support.className='meta-block tool-support-block';
 support.innerHTML='<p>[SUPPORT]</p><a class="button tool-support-button" href="https://www.buymeacoffee.com/pavel.zosim" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">☕</span> Buy me a coffee</a>';
 right.append(support);
}
async function tools(){
 const [registry,source]=await Promise.all([json('/content/posts/index.json'),doc('/')]);
 const store=source.querySelector('[data-gumroad-shelf]');right.replaceChildren(clean(store));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});shelves();
 await renderTools({main,left,right,registry,escape,heading});
}
async function projects(){
 const [registry,source]=await Promise.all([json('/content/projects/index.json'),doc('/')]);
 const records=registry.projects;
 main.innerHTML=heading('Projects','projects / production records','Selected technical-art production records.')+section('project-directory','Selected projects','<div class="highlight-strip projects-directory"></div>');
 renderProjectCards(main.querySelector('.projects-directory'),records,{sourceHome:source});
 outline('PROJECTS.md',[['#project-directory','Index'],...records.map(r=>['#project-'+r.slug,r.title])]);
 right.replaceChildren(clean(source.querySelector('[data-gumroad-shelf]')),clean(source.querySelector('[data-online-tools-shelf]')));
 localToolLinks(right);
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.add('button--outline');a.textContent='Buy →';});shelves();
}
async function blog(){
 const [registry,source]=await Promise.all([json('/content/posts/index.json'),doc('/')]);
 right.replaceChildren(clean(source.querySelector('[data-gumroad-shelf]')),clean(source.querySelector('[data-online-tools-shelf]')));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});localToolLinks(right);shelves();
 renderBlog({main,left,registry,escape,heading});
}
async function components(){
 await loadScript('/scripts/post-registry.js?v=2');
 const source=await doc('./components.html');main.replaceChildren(...source.querySelector('template').content.cloneNode(true).childNodes);
 outline('STYLE_GUIDE.md',[['#contract','Contract'],['#tokens','Tokens'],['#actions','Actions'],['#fields','Fields'],['#states','States'],['#density','Reading density'],['#panels','Settings panels'],['#extension','Extension & article patterns']]);
 const styles=getComputedStyle(document.documentElement),register=main.querySelector('#token-register');
 for(const name of ['paper','surface','ink','muted','blue','yellow','line','body','ui','meta','space-xs','space-sm','space-md','space-flow','space-group','space-section','left','right']){const term=document.createElement('dt'),value=document.createElement('dd');term.textContent=`--${name}`;value.textContent=styles.getPropertyValue(`--${name}`).trim();register.append(term,value);}
 const disclosure=createControlDisclosure('Settings');const sample=document.createElement('p');sample.textContent='Shared disclosure: keyboard accessible, with an explicit Collapse / Expand label.';disclosure.append(sample);main.querySelector('#disclosure-example').append(disclosure);
 main.querySelector('#article-patterns').innerHTML='<aside class="atlas-callout atlas-callout--note"><p>Article patterns are being migrated individually from the <a href="/blog/style-guide/">existing Style Guide</a>. Legacy markup is not imported into this catalogue.</p></aside>';
 right.innerHTML=facts('[CANON]',[['scope','Approved lab UI'],['buttons','32 px min'],['UI','12 px'],['body','14 px / 1.6'],['flow','16 / 22 / 32 px']]);
 const range=main.querySelector('#detail-range'),value=main.querySelector('#detail-value');range.addEventListener('input',()=>{value.value=range.value;});
 const form=main.querySelector('.control-form');form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{main.querySelector('#demo-result').textContent=form.checkValidity()?'Ready. Settings are valid.':'Check the highlighted field.';});
 outline('STYLE_GUIDE.md',await completeStyleGuide(main),1);
}
try{
 document.body.dataset.template=page;document.querySelector('#original').href=pages[page];
 site=await createSiteRoutes();
 const slug=new URLSearchParams(location.search).get('slug');
 if(page==='article'&&slug){const record=site.records.find(r=>r.slug===slug);if(!record)throw Error('Unknown article: '+slug);pages.article=record.localPath;}
 if(page==='project'&&slug)pages.project='/projects/'+slug+'/';
 document.querySelector('#original').href=pages[page];
 if(page==='article'||page==='project'||page==='components'||page==='privacy'||page==='notfound')document.body.dataset.detail='';
 document.querySelectorAll('.review-bar nav a').forEach(a=>{if(a.search===`?page=${page}`)a.setAttribute('aria-current','page');});
 document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section.split(' ').includes(page))a.setAttribute('aria-current','page');});
 await({home,index,tools,projects,blog,article,project,tool,compressor,noise,components,privacy,review,notfound}[page])();
 if(['tool','compressor','noise'].includes(page))await toolAfterword();
 if(page==='project'){
  const [projectData,postData,layouts]=await Promise.all([json('/content/projects/index.json'),json('/content/posts/index.json'),json('./project-layouts.json')]);
  const selectedSlug=new URLSearchParams(location.search).get('slug')||'nasa-first-woman';const selected=projectData.projects.find(r=>r.slug===selectedSlug);if(!selected)throw Error('Unknown project: '+selectedSlug);
  renderProject({record:selected,layout:layouts[selectedSlug]||{},projects:projectData.projects,posts:postData.records,main,left,right,escape,heading,section,facts});
 }
 if(page==='article')await restoreArticleElements();
 const current=left.querySelector(`a[href="?page=${page}"]`);if(current)current.setAttribute('aria-current','page');
 const commandPage=['tool','compressor','noise'].includes(page)?'index':({article:'blog',project:'projects'}[page]||page);
 const release=await json('./tool-release.json');
 if(['tool','compressor','noise'].includes(page)){
  const version=document.createElement('span');version.className='tool-version';version.textContent=`v${release.version}`;main.querySelector('.tool-titlebar')?.append(version);
 }
 main.querySelectorAll('.tool-related-card>img').forEach(img=>{const frame=document.createElement('span');frame.className='tool-related-preview';img.before(frame);frame.append(img);});
 main.querySelectorAll('.tool-related-card .eyebrow,.tool-catalog-card>p:first-child').forEach(label=>label.append(` · v${release.version}`));
 document.querySelectorAll('.commander a').forEach(a=>{if(a.search===`?page=${commandPage}`&&!a.hash)a.setAttribute('aria-current','page');});
 main.querySelectorAll('[role="status"],#status,#noise-status').forEach(el=>el.classList.add('notice'));
 main.querySelectorAll('.browser-tools-nav button').forEach(el=>el.classList.add('button','button--quiet'));
 main.querySelectorAll('video').forEach(video=>{video.defaultMuted=true;video.muted=true;video.setAttribute('muted','');});
 site.observe(main);site.observe(left);site.observe(right);
 main.setAttribute('aria-busy','false');document.title=(main.querySelector('h1')?.textContent||'Atlas')+' — branch review';
 setupNavigation(page);
 if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}catch(error){main.replaceChildren(Object.assign(document.createElement('p'),{className:'notice',textContent:`Preview could not load: ${error.message}`}));main.setAttribute('aria-busy','false');console.error(error);}
