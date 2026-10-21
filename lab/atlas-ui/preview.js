/* Local comparison harness. Only source content is imported, never its CSS/scripts. */
import {setupNavigation} from './navigation.js?v=review-22';
import {setupHomeInteractions} from './home.js?v=review-17';
import {renderTools} from './tools.js?v=review-25';
const pages={home:'/',index:'/online-tools/',tools:'/tools/',article:'/content/posts/atlas-html/procedural-travel-resolution.html',project:'/projects/nasa-first-woman/',tool:'/online-tools/sprite-sheet-assembly/',components:'/blog/style-guide/'};
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
function shelves(){document.querySelectorAll('[data-gumroad-shelf],[data-online-tools-shelf]').forEach(shelf=>{const slides=[...shelf.querySelectorAll('.gumroad-shelf__slide')];let index=0;const render=()=>{slides.forEach((s,i)=>{s.hidden=i!==index;s.inert=i!==index;});const count=shelf.querySelector('output');if(count){count.textContent=`${index+1} / ${slides.length}`;count.setAttribute('aria-live','polite');}};shelf.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>{index=(index+(i?1:-1)+slides.length)%slides.length;render();}));render();});}
async function home(){
 const source=await doc('/');
 main.replaceChildren(...clean(source.querySelector('main')).childNodes);
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
 await loadScript('/scripts/wireframe-shape.js?v=6');
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
async function tool(){const source=await doc(pages.tool);main.replaceChildren(...clean(source.querySelector('main')).childNodes);outline('ONLINE_TOOLS.md',[['?page=index','Index'],['?page=tool','Sprite Sheet Assembly'],['/online-tools/image-compressor/','Image Compressor'],['/online-tools/noise-generator/','Noise Generator']]);sourceRail(source);await loadScript('/scripts/sprite-sheet-core.js?v=1');await loadScript('/scripts/sprite-sheet-tool.js?v=10');}
async function tools(){
 const [registry,source]=await Promise.all([json('/content/posts/index.json'),doc('/')]);
 const store=source.querySelector('[data-gumroad-shelf]');right.replaceChildren(clean(store));
 right.querySelectorAll('.gumroad-shelf__action').forEach(a=>{a.classList.remove('atlas-btn--quiet');a.classList.add('button--outline');a.textContent='Buy →';});shelves();
 await renderTools({main,left,right,registry,escape,heading});
}
async function components(){
 const source=await doc('./components.html');main.replaceChildren(...source.querySelector('template').content.cloneNode(true).childNodes);
 outline('COMPONENTS.md',[['#actions','Actions'],['#fields','Fields'],['#states','States'],['#density','Reading density']]);
 right.innerHTML=facts('[REVIEW]',[['state','Candidate'],['buttons','32 px min'],['UI','12 px'],['body','14 px / 1.6'],['flow','16 / 22 / 32 px']]);
 const range=main.querySelector('#detail-range'),value=main.querySelector('#detail-value');range.addEventListener('input',()=>{value.value=range.value;});
 const form=main.querySelector('form');form.addEventListener('submit',event=>{event.preventDefault();main.querySelector('#demo-result').textContent='Ready. Settings validated locally; this is a component example, not a generator.';});
}
try{
 document.body.dataset.template=page;document.querySelector('#original').href=pages[page];
 document.querySelectorAll('.review-bar nav a').forEach(a=>{if(a.search===`?page=${page}`)a.setAttribute('aria-current','page');});
 document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section.split(' ').includes(page))a.setAttribute('aria-current','page');});
 await({home,index,tools,article,project,tool,components}[page])();
 const current=left.querySelector(`a[href="?page=${page}"]`);if(current)current.setAttribute('aria-current','page');
 const commandPage=page==='tool'?'index':page;
 document.querySelectorAll('.commander a').forEach(a=>{if(a.search===`?page=${commandPage}`&&!a.hash)a.setAttribute('aria-current','page');});
 main.setAttribute('aria-busy','false');document.title=`Atlas ${page} — isolated review`;
 setupNavigation(page);
 if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}catch(error){main.replaceChildren(Object.assign(document.createElement('p'),{className:'notice',textContent:`Preview could not load: ${error.message}`}));main.setAttribute('aria-busy','false');console.error(error);}
