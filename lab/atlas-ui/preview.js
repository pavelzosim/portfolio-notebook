import {setupSDFPanel} from './sdf-panel.js';
import {setupMaterialPanel} from './material-panel.js?v=review-193';
import {setupPackerPanel} from './packer-panel.js?v=review-187';
import {setupToolSidebar} from './tool-sidebar.js?v=review-191';
/* Canonical site composition shared by public output and the review harness. */
import {readSourceDocument} from './source-document.js';
const publicPage=document.body.dataset.publicPage;
const routeParams=new URLSearchParams(location.search);
const routeSlug=document.body.dataset.slug||routeParams.get('slug');
import {setupNavigation} from './navigation.js?v=review-22';
import {setupHomeInteractions} from './home.js?v=review-193';
import {renderTools} from './tools.js?v=review-137';
import {renderBlog} from './blog.js?v=review-118';
import {renderProject} from './project.js?v=review-180';
import {relatedRecords,selectRelatedArticles} from './related-records.js?v=review-157';
import {setupCompressorPanel} from './compressor-panel.js?v=review-126';
import {setupNoisePanel,setupNoisePresets} from './noise-panel.js?v=review-131';
import {createControlDisclosure} from './control-disclosure.js?v=review-84';
import {setupShelfCarousels} from './shelf-carousel.js?v=review-184';
import {renderRecordPreviews} from './record-preview.js?v=review-184';
import {setupProductLists} from './product-list.js?v=review-108';
import {setupToolCatalog,toolRoutes} from './tool-catalog.js?v=review-193';
import {renderProjectCards} from './project-card.js?v=review-114';
import {createShareSection} from './share-controls.js?v=review-119';
import {createToolFeedback} from './tool-feedback.js?v=review-128';
import {setupArticleNavigation} from './article-navigation.js?v=review-177';
import {setupSpritePanel} from './sprite-panel.js?v=review-122';
import {renderArticlePassport} from './article-passport.js?v=review-166';
import {completeStyleGuide} from './style-guide.js?v=review-193';
import {createSiteRoutes} from './site-routes.js?v=review-193';
import {adaptArticle,extractArticleBody,enhanceArticle} from './article-adapter.js?v=review-174';
import {renderSiteReview} from './site-review.js?v=review-145';
let site;
async function review(){renderSiteReview({main,left,right,site,heading,section,escape});}
async function notfound(){location.replace('/404.html');}

const pages={home:'/',index:'/online-tools/',tools:'/tools/',projects:'/projects/',blog:'/blog/',article:'/content/posts/atlas-html/procedural-travel-resolution.html',project:'/projects/nasa-first-woman/',tool:'/online-tools/sprite-sheet-assembly/',compressor:'/online-tools/image-compressor/',noise:'/online-tools/noise-generator/',packer:'/online-tools/pbr-channel-packer/',material:'/online-tools/normal-map-generator/',sdf:'/online-tools/sdf-texture-generator/',components:'/blog/style-guide/',privacy:'/privacy/',notfound:'/404.html',review:'/'};
const page=publicPage||(Object.hasOwn(pages,routeParams.get('page'))?routeParams.get('page'):'home');
const main=document.querySelector('#content'),left=document.querySelector('#outline'),right=document.querySelector('#passport');
const publicFallback=publicPage?main.innerHTML:null;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=async url=>{const response=await fetch(new URL(url,import.meta.url),{cache:'no-store'});if(!response.ok)throw Error(`${url}: ${response.status}`);return response;};
const doc=readSourceDocument;
const json=async url=>(await get(url)).json();
const heading=(title,context,summary)=>`<header class="document-head"><p class="breadcrumb">${escape(context)}</p><h1>${escape(title)}</h1>${summary?`<p>${escape(summary)}</p>`:''}</header>`;
const section=(id,title,html)=>`<section class="document-section" id="${id}"><header class="section-label"><span>§</span><h2>${escape(title)}</h2></header>${html}</section>`;
const facts=(label,entries)=>`<div class="meta-block"><p>${escape(label)}</p><dl>${entries.map(([k,v])=>`<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl></div>`;
const outline=(label,entries,start=0)=>{left.innerHTML=`<p class="rail-title">${escape(label)}</p><nav>${entries.map(([href,title],i)=>`<a href="${href}">${String(i+start).padStart(2,'0')} ${escape(title.replace(/^\d+\s+/,''))}</a>`).join('')}</nav>`;};
const loadScript=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(src,import.meta.url).href;el.onload=resolve;el.onerror=()=>reject(Error('Script unavailable: '+src));document.head.append(el);});
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
 await setupHomeInteractions(main,registry.records);
}
async function index(){
 const [source,registry]=await Promise.all([doc(pages.index),json('/content/online-tools/index.json')]);
 const records=registry.records.filter(record=>record.state==='published'&&record.indexable!==false);
 main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 setupToolCatalog(main,records);
 localToolLinks(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],...records.map(record=>[`?page=${toolRoutes[record.slug]}`,record.title.replace(/ Tool$| for Technical Artists$/g,'')])]);
 const links=[...left.querySelectorAll('nav a')];records.forEach((record,i)=>{links[i+1].textContent=`${record.id.split('-').at(-1).replace(/^0/,'')} ${record.title.replace(/ Tool$| for Technical Artists$/g,'')}`;});
 const homeSource=await doc('/');
 const store=homeSource.querySelector('[data-gumroad-shelf]');
 if(!store)throw new Error('The approved Home Tool Store is unavailable.');
 right.replaceChildren(clean(store));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});
 shelves();
 main.querySelector('.section-label em').textContent=`${String(records.length).padStart(2,'0')} LIVE TOOLS`;
 main.querySelector('.section-label h2').textContent='Browser tools';
}
async function articleRecord(){const original=site.records.find(r=>r.localPath===pages.article);const revision=(await json('./article-revisions.json'))[original.slug];return {record:{...original,...(revision?{summary:revision.summary,outlineStart:1}: {})},path:revision?.path||pages.article};}
async function article(){const {record,path}=await articleRecord(),source=await doc(path);main.innerHTML=heading(record.title,'blog / '+record.group,record.summary);const body=extractArticleBody(source);adaptArticle(body,escape,{record,groupAdjacentImages:record.slug==='technical-art-compute-shaders-in-unity-introduction'});main.append(body);const used=new Set();body.querySelectorAll('h2,h3,h4').forEach((h,i)=>{let id=h.id||'section-'+(i+1);while(used.has(id))id+='-'+(i+1);h.id=id;used.add(id);});const entries=[...body.querySelectorAll('h2[id]')].map(h=>['#'+h.id,h.textContent]);outline('ARTICLE.md',entries,record.outlineStart??(entries[0]?.[1].toLowerCase().includes('overview')?0:1));if(!routeParams.has('static'))void enhanceArticle(source,body);}
async function project(){} // The shared registry renderer below owns all project pages.
async function restoreArticleElements(){
 const registry=await json('/content/posts/index.json');
 const {record}=await articleRecord();
 const related=registry.records.filter(r=>r.id!==record.id&&r.group===record.group&&r.state==='published'&&r.indexable!==false).sort((a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0));
right.innerHTML=`<div class="meta-block article-related"><p>[RELATED / ${escape(record.group.toUpperCase())}]</p><ul>${related.map(r=>`<li><a href="${escape(r.localPath||r.publicUrl||r.sourceUrl)}">${escape(r.title)}</a></li>`).join('')}</ul></div>`;
 const homeSource=await doc('/'),store=homeSource.querySelector('[data-gumroad-shelf]'),online=homeSource.querySelector('[data-online-tools-shelf]');if(store){right.append(clean(store));right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});}if(online)right.append(clean(online));localToolLinks(right);shelves();
 const head=main.querySelector('.document-head');renderArticlePassport(head,record);
 if(record.series)main.querySelectorAll('.atlas-series-nav__part').forEach(part=>{
  const order=Number(part.querySelector('.atlas-series-nav__num')?.textContent),entry=registry.records.find(candidate=>candidate.series?.slug===record.series.slug&&candidate.series.order===order&&candidate.state==='published'&&candidate.indexable!==false);
  if(!entry)return;
  const current=entry.id===record.id,status=part.querySelector('.atlas-series-nav__status');
  part.classList.toggle('atlas-series-nav__part--current',current);part.classList.remove('atlas-series-nav__part--soon');
  if(status){status.textContent=current?'CURRENT':'LIVE';status.className='atlas-series-nav__status';}
  if(!current&&!part.querySelector('a')){const link=document.createElement('a');link.href=entry.localPath;link.append(...part.childNodes);part.append(link);}
 });
 const share=createShareSection(record.publicUrl||record.sourceUrl);
 main.querySelector('.article-body').append(share);
 const referenceSlugs=[...main.querySelectorAll('.atlas-ref-list a[href]')].map(a=>new URL(a.getAttribute('href'),location.href).pathname.split('/').filter(Boolean).at(-1));
 const suggestions=selectRelatedArticles(record,registry.records,referenceSlugs);
 if(suggestions.length)main.insertAdjacentHTML('beforeend',section('related-records','Related articles',relatedRecords(suggestions,escape,{prefix:'article-related'})));
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
  const mark=document.createElement('span');mark.className='article-subheading-mark';mark.setAttribute('aria-hidden','true');mark.textContent=h.tagName==='H4'?'+ ':'> ';h.prepend(mark);
 });
 setupArticleNavigation(main);
}
async function toolOutline(){const {records}=await json('/content/online-tools/index.json');outline('ONLINE_TOOLS.md',[['?page=index','Index'],...records.filter(r=>r.state==='published'&&r.indexable!==false).map(r=>['?page='+toolRoutes[r.slug],r.title])]);}
async function material(){const source=await doc(pages.material);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);setupMaterialPanel(main);await toolOutline();}
async function packer(){const source=await doc(pages.packer);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);setupPackerPanel(main);await toolOutline();}
async function tool(){const source=await doc(pages.tool);main.replaceChildren(...clean(source.querySelector('main')).childNodes);setupSpritePanel(main);await toolOutline();sourceRail(source);await loadScript('/scripts/sprite-sheet-core.js?v=1');await loadScript('/scripts/sprite-sheet-tool.js?v=10');}
async function privacy(){
 const source=await doc(pages.privacy),content=clean(source.querySelector('main'));const title=content.querySelector('h1')?.textContent||'Privacy';content.querySelector('h1')?.remove();main.innerHTML=heading(title,'site / privacy','');const body=document.createElement('div');body.className='article-body';body.append(...content.childNodes);main.append(body);outline('PRIVACY.md',[['?page=home','Home']]);right.replaceChildren();
}
async function compressor(){
 const source=await doc(pages.compressor);main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 setupCompressorPanel(main);
 await toolOutline();sourceRail(source);
 renderToolInstructions(['Add up to 10 images.','Choose a preset or set format, quality and dimensions.','Process the batch.','Compare source and output; inspect channels and alpha.','Download the selected image or batch ZIP.']);
 main.querySelector('.tool-workflow')?.remove();main.querySelector('.tool-support')?.remove();
 await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/image-compressor-tool.js?v=3');
}
async function sdf(){const source=await doc(pages.sdf);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);setupSDFPanel(main);await toolOutline();}
async function noise(){
 const source=await doc(pages.noise);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);
 setupNoisePanel(main);
 renderToolInstructions(['Choose a surface preset.','Tune the structure and normal settings.','Generate the preview.','Inspect the texture on the sphere or tiled plane; adjust the light.','Choose a resolution and download a PNG or all maps as ZIP.']);
 const explanation=[...main.querySelectorAll('.tool-section>p')].find(p=>p.textContent.startsWith('Choose a preset, tune the structure,'));
 if(explanation)explanation.textContent=explanation.textContent.replace(/^Choose a preset, tune the structure, then inspect it on the sphere or tiled plane\.\s*/,'');
 await toolOutline();
 main.querySelectorAll('.noise-note').forEach(p=>{const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';p.before(note);note.append(p);});
 await loadScript('/scripts/noise-generator-core.js?v=2');setupNoisePresets(window.NoiseGeneratorCore,main);await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/noise-material-preview.js?v=2');await loadScript('/scripts/noise-generator-tool.js?v=3');
}
function renderToolInstructions(steps){
 const help=document.createElement('div');help.className='meta-block tool-instructions';
 const heading=document.createElement('p');heading.textContent='[HOW TO USE]';const list=document.createElement('ol');
 for(const text of steps){const item=document.createElement('li');item.textContent=text;list.append(item);}help.append(heading,list);right.append(help);
}
async function toolAfterword(){
 setupToolSidebar(right);
 renderToolSupport();
 const records=(await json('/content/online-tools/index.json')).records.filter(r=>r.state==='published'&&r.indexable!==false),current=records.find(r=>r.slug===Object.keys(toolRoutes).find(slug=>toolRoutes[slug]===page));
 const url=encodeURIComponent(current.publicUrl),title=encodeURIComponent(current.title);
 main.insertAdjacentHTML('beforeend',section('share','Share',`<div class="article-share tool-share"><div class="article-share-header">[SHARE]</div><div class="article-share-body"><nav aria-label="Share tool"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener noreferrer">[linkedin]</a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener noreferrer">[facebook]</a><a href="https://twitter.com/intent/tweet?url=${url}&amp;text=${title}" target="_blank" rel="noopener noreferrer">[twitter]</a></nav></div></div>`));
 main.querySelector('#share>.section-label').remove();
 const feedback=createToolFeedback();feedback.id='tool-feedback';main.querySelector('#share').append(feedback);
 const others=records.filter(r=>r.id!==current.id);
 main.insertAdjacentHTML('beforeend',section('other-tools','Other online tools',relatedRecords(others,escape,{prefix:'tool-related'})));
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
 document.body.dataset.template=page;document.querySelector('#original')?.setAttribute('href',pages[page]);
 site=await createSiteRoutes();
 const slug=routeSlug;
 if(page==='article'&&slug){const record=site.records.find(r=>r.slug===slug);if(!record)throw Error('Unknown article: '+slug);pages.article=record.localPath;}
 if(page==='project'&&slug)pages.project='/projects/'+slug+'/';
 document.querySelector('#original')?.setAttribute('href',pages[page]);
 if(page==='article'||page==='project'||page==='components'||page==='privacy'||page==='notfound')document.body.dataset.detail='';
 document.querySelectorAll('.review-bar nav a').forEach(a=>{if(a.search===`?page=${page}`)a.setAttribute('aria-current','page');});
 document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section.split(' ').includes(page))a.setAttribute('aria-current','page');});
 await({home,index,tools,projects,blog,article,project,tool,compressor,noise,packer,material,sdf,components,privacy,review,notfound}[page])();
 if(['tool','compressor','noise','packer','material','sdf'].includes(page))await toolAfterword();
 if(page==='project'){
  const [projectData,postData,layouts]=await Promise.all([json('/content/projects/index.json'),json('/content/posts/index.json'),json('./project-layouts.json')]);
  const selectedSlug=routeSlug||'nasa-first-woman';const selected=projectData.projects.find(r=>r.slug===selectedSlug);if(!selected)throw Error('Unknown project: '+selectedSlug);
  renderProject({record:selected,layout:layouts[selectedSlug]||{},projects:projectData.projects,posts:postData.records,main,left,right,escape,heading,section,facts});
 }
 if(page==='article')await restoreArticleElements();
 const current=left.querySelector(`a[href="?page=${page}"]`);if(current)current.setAttribute('aria-current','page');
 const commandPage=['tool','compressor','noise','packer','material','sdf'].includes(page)?'index':({article:'blog',project:'projects'}[page]||page);
 const release=await json('./tool-release.json');
 if(['tool','compressor','noise','packer','material','sdf'].includes(page)){
  const version=document.createElement('span');version.className='tool-version';version.textContent=`v${release.version}`;main.querySelector('.tool-titlebar')?.append(version);
 }
 main.querySelectorAll('.tool-related-card>img').forEach(img=>{const frame=document.createElement('span');frame.className='tool-related-preview';img.before(frame);frame.append(img);});
main.querySelectorAll('#other-tools .tool-related-card .eyebrow,a.tool-catalog-card>p:first-child').forEach(label=>label.append(` · v${release.version}`));
 const commandPath={home:'/',projects:'/projects/',tools:'/tools/',index:'/online-tools/',blog:'/blog/'}[commandPage];
 document.querySelectorAll('.commander a').forEach(a=>{a.removeAttribute('aria-current');if(!a.hash&&(a.search===`?page=${commandPage}`||(publicPage&&a.pathname===commandPath)))a.setAttribute('aria-current','page');});
 main.querySelectorAll('[role="status"],#status,#noise-status').forEach(el=>el.classList.add('notice'));
 main.querySelectorAll('.browser-tools-nav button').forEach(el=>el.classList.add('button','button--quiet'));
 main.querySelectorAll('video').forEach(video=>{video.defaultMuted=true;video.muted=true;video.setAttribute('muted','');});
 site.observe(document.body);
 main.setAttribute('aria-busy','false');if(!publicPage)document.title=(main.querySelector('h1')?.textContent||'Atlas')+' — branch review';
 setupNavigation(page);
 if(publicPage)document.body.dataset.runtimeReady='true';
 if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}catch(error){if(publicPage){document.body.dataset.runtimeReady='error';main.innerHTML=publicFallback;main.prepend(Object.assign(document.createElement('p'),{className:'notice',textContent:'Interactive controls are unavailable. Reload this page to try again.'}));}else main.replaceChildren(Object.assign(document.createElement('p'),{className:'notice',textContent:`Preview could not load: ${error.message}`}));main.setAttribute('aria-busy','false');console.error(error);}
