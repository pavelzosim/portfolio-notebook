/* Local comparison harness. Only source content is imported, never its CSS/scripts. */
import {setupNavigation} from './navigation.js?v=review-22';
import {setupHomeInteractions} from './home.js?v=review-100';
import {renderTools} from './tools.js?v=review-25';
import {renderBlog} from './blog.js?v=review-33';
import {renderProject} from './project.js?v=review-95';
import {setupCompressorPanel} from './compressor-panel.js?v=review-84';
import {setupNoisePanel,setupNoisePresets} from './noise-panel.js?v=review-85';
import {createControlDisclosure} from './control-disclosure.js?v=review-84';
import {setupShelfCarousels} from './shelf-carousel.js?v=review-104';
import {renderRecordPreviews} from './record-preview.js?v=review-105';
import {renderArticlePassport} from './article-passport.js?v=review-91';
import {completeStyleGuide} from './style-guide.js?v=review-105';
const pages={home:'/',index:'/online-tools/',tools:'/tools/',projects:'/projects/',blog:'/blog/',article:'/content/posts/atlas-html/procedural-travel-resolution.html',project:'/projects/nasa-first-woman/',tool:'/online-tools/sprite-sheet-assembly/',compressor:'/online-tools/image-compressor/',noise:'/online-tools/noise-generator/',components:'/blog/style-guide/'};
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
 main.querySelectorAll('.home-store-row>a').forEach(a=>{a.classList.remove('atlas-btn--ghost');a.classList.add('button--outline');});
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
 const cards=[...main.querySelectorAll('.tool-catalog-card')];
 if(cards.length!==records.length)throw new Error('Catalog source and registry have different live-tool counts.');
 for(const card of cards){const title=card.querySelector('h3');card.setAttribute('aria-labelledby',`catalog-${card.href.split('/').filter(Boolean).at(-1)}`);title.id=card.getAttribute('aria-labelledby');}
 localToolLinks(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],...records.map(record=>[record.slug==='sprite-sheet-assembly'?'?page=tool':`/online-tools/${record.slug}/`,record.title.replace(/ Tool$| for Technical Artists$/g,'')])]);
 const links=[...left.querySelectorAll('nav a')];records.forEach((record,i)=>{links[i+1].textContent=`${record.id.split('-').at(-1).replace(/^0/,'')} ${record.title.replace(/ Tool$| for Technical Artists$/g,'')}`;});
 const homeSource=await doc('/');
 const store=homeSource.querySelector('[data-gumroad-shelf]');
 if(!store)throw new Error('The approved Home Tool Store is unavailable.');
 right.replaceChildren(clean(store));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});
 shelves();
 main.querySelector('.section-label em').textContent=`${String(records.length).padStart(2,'0')} LIVE TOOLS`;
}
async function article(){const source=await doc(pages.article);const title=source.querySelector('h1').textContent;main.innerHTML=heading(title,'blog / procedural systems',source.querySelector('meta[name=description]').content);const body=clean(source.querySelector('.content-block'));body.className='article-body';main.append(body);const entries=[...body.querySelectorAll('h2[id]')].map(h=>['#'+h.id,h.textContent]);outline('ARTICLE.md',entries);right.innerHTML=facts('[RECORD]',[['kind','Article'],['state','Published'],['topic','Procedural systems']])+'<div class="meta-block"><p>[READ NEXT]</p><a href="/blog/">Browse technical notes →</a></div>';}
async function project(){const record=(await json('/content/projects/index.json')).projects.find(r=>r.slug==='nasa-first-woman');main.innerHTML=heading(record.title,`projects / ${record.id}`,record.summary)+section('overview','Overview',`<img class="project-cover" src="${escape(record.image)}" alt="${escape(record.title)}"><p>${escape(record.overview)}</p>`);const entries=[['#overview','Overview']];for(const [key,label]of [['scope','Scope'],['roleDetails','Role'],['solutions','Implementation'],['results','Results']]){main.insertAdjacentHTML('beforeend',section(key,label,`<ul>${record[key].map(v=>`<li>${escape(v)}</li>`).join('')}</ul>`));entries.push(['#'+key,label]);}outline('PROJECT.md',entries);right.innerHTML=facts('[RECORD]',[['id',record.id],['client',record.client],['status',record.status],['role',record.role]])+facts('[STACK]',Object.entries(record.stack));}
async function restoreArticleElements(){
 const registry=await json('/content/posts/index.json');
 const record=registry.records.find(r=>r.localPath===pages.article);
 const related=registry.records.filter(r=>r.id!==record.id&&r.group===record.group&&r.state==='published'&&r.indexable!==false).sort((a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0));
 right.innerHTML=facts('[RECORD]',[['kind',record.kind],['topic',record.group]])+`<div class="meta-block article-related"><p>[RELATED / ${escape(record.group.toUpperCase())}]</p><ul>${related.map(r=>`<li><a href="${escape(r.localPath||r.publicUrl||r.sourceUrl)}">${escape(r.title)}</a></li>`).join('')}</ul></div>`;
 const head=main.querySelector('.document-head');head.classList.add('article-passport');
 head.innerHTML=`<div class="passport-title-bar"><span>pavelzosim : ~ # cat ${escape(record.slug)}.log</span><span>[ SYS_STATUS: ${escape(record.state.toUpperCase())} ]</span></div><h1>${escape(record.title)}</h1><div class="passport-grid"><dl><div><dt>project</dt><dd>${escape(record.group)}</dd></div><div><dt>module</dt><dd>${escape(record.kind)}</dd></div></dl><dl><div><dt>version</dt><dd>WEB</dd></div><div><dt>log_id</dt><dd>${escape(record.id)}</dd></div></dl></div><div class="passport-meta"><span>auth: Pavel Zosim</span><span>created: ${escape(record.datePublished.replaceAll('-','.'))}</span></div><div class="passport-tags">${record.tags.map(t=>`<a href="?page=blog&amp;q=${encodeURIComponent(t)}">#${escape(t)}</a>`).join('')}</div><p class="passport-summary">${escape(record.summary)}</p>`;
 const metadata=[['log_id',record.id],['project',record.group],['auth','Pavel Zosim'],['created',record.datePublished.replaceAll('-','.')],['revision',record.version||record.dateModified.replaceAll('-','.')]];
 const field=([key,value])=>`<span class="passport-header-field"><span class="passport-header-key">${escape(key)}:</span> ${escape(value)}</span>`;
 head.querySelector('.passport-title-bar').innerHTML=`<div class="passport-header-left">${metadata.slice(0,2).map(field).join('')}</div><div class="passport-header-right">${metadata.slice(2).map(field).join('')}</div>`;
 head.querySelector('.passport-grid').remove();head.querySelector('.passport-meta').remove();
 head.querySelector('.passport-summary').prepend('Summary: ');
 renderArticlePassport(head,record);
 const shareUrl=encodeURIComponent(record.publicUrl||record.sourceUrl),shareTitle=encodeURIComponent(record.title);
 const share=document.createElement('section');share.className='article-share';share.setAttribute('aria-label','Share this record');
 share.innerHTML=`<div class="article-share-header">[SHARE]</div><div class="article-share-body"><p>Share this record</p><nav aria-label="Share links"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer">linkedin</a><a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer">facebook</a><a href="https://twitter.com/intent/tweet?url=${shareUrl}&amp;text=${shareTitle}" target="_blank" rel="noopener noreferrer">twitter</a></nav></div>`;
 main.querySelector('.article-body').append(share);
 const shareLabel=share.querySelector('.article-share-body p');share.querySelector('.article-share-header').append(shareLabel);
 share.querySelectorAll('a').forEach(a=>{a.textContent=`[${a.textContent}]`;});
 share.querySelector('.article-share-header p').remove();
 main.querySelectorAll('.atlas-ref-item').forEach(row=>{
  const link=row.querySelector('.atlas-ref-link');if(!link)return;
  const title=link.textContent,body=row.querySelector('.atlas-ref-body');
  const text=document.createElement('span');text.textContent=title;link.replaceWith(text);
  link.classList.add('atlas-ref-row-link');link.replaceChildren(...row.childNodes);row.append(link);
 });
 const toc=main.querySelector('.atlas-toc');toc?.insertAdjacentHTML('afterbegin','<p class="toc-title">[ TABLE_OF_CONTENTS // NAVIGATION ]</p>');
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
 main.querySelectorAll('.atlas-toc a').forEach(a=>a.addEventListener('click',e=>{
  if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const target=document.getElementById(a.hash.slice(1));if(!target)return;
  e.preventDefault();history.pushState(null,'',a.hash);target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});
 }));
}
async function tool(){const source=await doc(pages.tool);main.replaceChildren(...clean(source.querySelector('main')).childNodes);outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['/online-tools/image-compressor/','Image Compressor'],['/online-tools/noise-generator/','Noise Generator']]);sourceRail(source);await loadScript('/scripts/sprite-sheet-core.js?v=1');await loadScript('/scripts/sprite-sheet-tool.js?v=10');}
async function compressor(){
 const source=await doc(pages.compressor);main.replaceChildren(...clean(source.querySelector('main')).childNodes);
 setupCompressorPanel(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['?page=compressor','Image Compressor'],['/online-tools/noise-generator/','Noise Generator']]);sourceRail(source);
 const help=document.createElement('div');help.className='meta-block tool-instructions';help.innerHTML='<p>[HOW TO USE]</p><ol><li>Add up to 10 images.</li><li>Choose a preset or set format, quality and dimensions.</li><li>Process the batch.</li><li>Compare source and output; inspect channels and alpha.</li><li>Download the selected image or batch ZIP.</li></ol>';right.append(help);
 main.querySelector('.tool-workflow')?.remove();main.querySelector('.tool-support')?.remove();
 await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/image-compressor-tool.js?v=3');
}
async function noise(){
 const source=await doc(pages.noise);main.replaceChildren(...clean(source.querySelector('main')).childNodes);sourceRail(source);
 setupNoisePanel(main);
 outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['?page=compressor','Image Compressor'],['?page=noise','Noise Generator']]);
 main.querySelectorAll('.noise-note').forEach(p=>{const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';p.before(note);note.append(p);});
 await loadScript('/scripts/noise-generator-core.js?v=2');setupNoisePresets(window.NoiseGeneratorCore,main);await loadScript('/scripts/image-compressor-core.js?v=1');await loadScript('/scripts/noise-material-preview.js?v=2');await loadScript('/scripts/noise-generator-tool.js?v=3');
}
async function toolAfterword(){
 renderToolSupport();
 const records=(await json('/content/online-tools/index.json')).records.filter(r=>r.state==='published'&&r.indexable!==false),current=records.find(r=>r.slug===({compressor:'image-compressor',noise:'noise-generator',tool:'sprite-sheet-assembly'}[page]));
 const url=encodeURIComponent(current.publicUrl),title=encodeURIComponent(current.title);
 main.insertAdjacentHTML('beforeend',section('share','Share',`<div class="article-share tool-share"><div class="article-share-header">[SHARE]</div><div class="article-share-body"><nav aria-label="Share tool"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener noreferrer">[linkedin]</a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener noreferrer">[facebook]</a><a href="https://twitter.com/intent/tweet?url=${url}&amp;text=${title}" target="_blank" rel="noopener noreferrer">[twitter]</a></nav></div></div>`));
 main.querySelector('#share>.section-label').remove();
 const others=records.filter(r=>r.id!==current.id);
 main.insertAdjacentHTML('beforeend',section('other-tools','Other online tools',`<div class="tool-related-grid">${others.map(r=>`<a class="tool-related-card" href="${escape(r.localPath)}" aria-labelledby="related-${escape(r.id)}"><img src="${escape(r.image)}" alt="${escape(r.imageAlt||r.title)}" loading="lazy"><div><span class="eyebrow">${escape(r.id)}</span><h3 id="related-${escape(r.id)}">${escape(r.title)}</h3><p>${escape(r.summary)}</p><span class="record-arrow" aria-hidden="true">open →</span></div></a>`).join('')}</div>`));
}
function renderToolSupport(){
 right.querySelectorAll('.meta-block').forEach(block=>{if(block.querySelector('p')?.textContent.trim()==='[SUPPORT]')block.remove();});
 const support=document.createElement('div');support.className='meta-block tool-support-block';
 support.innerHTML='<p>[SUPPORT]</p><div class="tool-support-note">Free local tool. Support development if it saves you time.</div><a class="button tool-support-button" href="https://www.buymeacoffee.com/pavel.zosim" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">☕</span> Buy me a coffee</a>';
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
 main.innerHTML=heading('Projects','projects / production records','Selected technical-art production records.')+section('project-directory','Selected projects',`<div class="highlight-strip projects-directory">${records.map(r=>`<a class="highlight-card" id="project-${escape(r.slug)}" href="${r.slug==='nasa-first-woman'?'?page=project':'/projects/'+escape(r.slug)+'/'}" aria-labelledby="title-${escape(r.id)}"><img src="${escape(r.image)}" alt="${escape(r.title)}" loading="lazy"><div class="highlight-meta"><span class="highlight-kind">${escape(r.id)} / ${escape(r.type)}</span><h3 id="title-${escape(r.id)}">${escape(r.title)}</h3><p>${escape(r.summary)}</p><small>${escape(r.role)}</small><small>${escape(r.environment)}</small><span class="record-arrow" aria-hidden="true">open →</span></div></a>`).join('')}</div>`);
 // Reuse approved Home wording; the registry is the fallback for future records.
 records.forEach(r=>{
  const homeAward=source.querySelector(`.project-records a[href="/projects/${r.slug}/"] .highlight-award`);
  const achievement=homeAward?.textContent||r.reach?.recognition||(r.awards||[]).map(a=>a.label).join(' · ')||(r.reach?.runtime?`${r.reach.runtime} operation · ${r.reach.state}`:'');
  if(!achievement)return;
  const line=document.createElement('span');line.className='highlight-award project-achievement';line.textContent=achievement;
  main.querySelector(`#project-${r.slug} .record-arrow`).before(line);
 });
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
 right.innerHTML=facts('[REVIEW]',[['state','Candidate'],['buttons','32 px min'],['UI','12 px'],['body','14 px / 1.6'],['flow','16 / 22 / 32 px']]);
 const range=main.querySelector('#detail-range'),value=main.querySelector('#detail-value');range.addEventListener('input',()=>{value.value=range.value;});
 const form=main.querySelector('form');form.addEventListener('submit',event=>{event.preventDefault();main.querySelector('#demo-result').textContent='Ready. Settings validated locally; this is a component example, not a generator.';});
 outline('STYLE_GUIDE.md',await completeStyleGuide(main),1);
}
try{
 document.body.dataset.template=page;document.querySelector('#original').href=pages[page];
 if(page==='article'||page==='project'||page==='components')document.body.dataset.detail='';
 document.querySelectorAll('.review-bar nav a').forEach(a=>{if(a.search===`?page=${page}`)a.setAttribute('aria-current','page');});
 document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section.split(' ').includes(page))a.setAttribute('aria-current','page');});
 await({home,index,tools,projects,blog,article,project,tool,compressor,noise,components}[page])();
 if(['tool','compressor','noise'].includes(page))await toolAfterword();
 if(page==='project'){
  const [projectData,postData,layouts]=await Promise.all([json('/content/projects/index.json'),json('/content/posts/index.json'),json('./project-layouts.json')]);
  renderProject({record:projectData.projects.find(r=>r.slug==='nasa-first-woman'),layout:layouts['nasa-first-woman'],projects:projectData.projects,posts:postData.records,main,left,right,escape,heading,section,facts});
 }
 if(page==='article')await restoreArticleElements();
 const current=left.querySelector(`a[href="?page=${page}"]`);if(current)current.setAttribute('aria-current','page');
 const commandPage=['tool','compressor','noise'].includes(page)?'index':page;
 const release=await json('./tool-release.json');
 if(['tool','compressor','noise'].includes(page)){
  const version=document.createElement('span');version.className='tool-version';version.textContent=`v${release.version}`;main.querySelector('.tool-titlebar')?.append(version);
 }
 main.querySelectorAll('.tool-related-card .eyebrow,.tool-catalog-card>p:first-child').forEach(label=>label.append(` · v${release.version}`));
 document.querySelectorAll('.commander a').forEach(a=>{if(a.search===`?page=${commandPage}`&&!a.hash)a.setAttribute('aria-current','page');});
 main.querySelectorAll('[role="status"],#status,#noise-status').forEach(el=>el.classList.add('notice'));
 main.querySelectorAll('.browser-tools-nav button').forEach(el=>el.classList.add('button','button--quiet'));
 main.querySelectorAll('video').forEach(video=>{video.defaultMuted=true;video.muted=true;video.setAttribute('muted','');});
 main.setAttribute('aria-busy','false');document.title=`Atlas ${page} — isolated review`;
 setupNavigation(page);
 if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}catch(error){main.replaceChildren(Object.assign(document.createElement('p'),{className:'notice',textContent:`Preview could not load: ${error.message}`}));main.setAttribute('aria-busy','false');console.error(error);}
