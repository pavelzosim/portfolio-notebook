/* Complete project candidate, sourced exclusively from the local registry. */
export function renderProject({record,projects=[],posts=[],main,left,right,escape,heading,section,facts}){
 const entries=[];
 const add=(id,title,body,label='')=>{main.insertAdjacentHTML('beforeend',section(id,title,body));const header=main.lastElementChild.querySelector('.section-label');header.querySelector('span').textContent=`§ ${String(entries.length+1).padStart(2,'0')}`;if(label)header.insertAdjacentHTML('beforeend',`<em>${escape(label)}</em>`);entries.push([id,title]);};
 const list=values=>`<ul class="project-record-list">${values.map(v=>`<li>${escape(v)}</li>`).join('')}</ul>`;
 const video=v=>`<figure class="project-media"><video controls playsinline preload="none" poster="${escape(v.poster||record.image)}" src="${escape(v.src)}"></video><figcaption>${escape(v.caption||v.title||'')}</figcaption></figure>`;
 const gallery=items=>`<div class="project-slider" role="region" aria-roledescription="carousel" aria-label="Project images" tabindex="0"><div class="project-slider-viewport">${items.map((m,i)=>`<figure class="project-media" ${i?'hidden':''} role="group" aria-roledescription="slide" aria-label="${i+1} / ${items.length}"><a href="${escape(m.src)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(m.alt||'Project image '+(i+1))} — open full size"><img src="${escape(m.src)}" alt="${escape(m.alt||record.title)}" loading="lazy"></a><figcaption>${escape((m.caption||'').split(' / ')[0])} · ${String(i+1).padStart(2,'0')}</figcaption></figure>`).join('')}</div><div class="project-slider-nav"><button type="button" class="button button--quiet" data-prev aria-label="Previous image">← Prev</button><output aria-live="polite" aria-atomic="true">1 / ${items.length}</output><button type="button" class="button button--quiet" data-next aria-label="Next image">Next →</button></div></div>`;
 const field=(key,value)=>`<span class="passport-header-field"><span class="passport-header-key">${escape(key)}:</span> ${escape(value)}</span>`;
 main.innerHTML=`<header class="document-head article-passport"><div class="passport-title-bar"><div class="passport-header-left">${field('log_id',record.id)}${field('project',record.metaType)}</div><div class="passport-header-right">${field('client',record.client)}</div></div><h1>${escape(record.title)}</h1><div class="passport-tags">${record.tools.map(t=>`<a href="?page=blog&amp;q=${encodeURIComponent(t)}">#${escape(t)}</a>`).join('')}</div><p class="passport-summary">Summary: ${escape(record.summary)}</p></header>`;
 add('overview','Overview',`<p class="project-overview">${escape(record.overview)}</p>`,'PROJECT RECORD');
 add('context','Scope & constraints',`<div class="project-context"><div><h3>Scope</h3>${list(record.scope||[])}</div><div><h3>Constraints</h3>${list(record.constraints||[])}</div></div>`,'CONTEXT');
 if(record.video)add('footage','Project footage',video(record.video),'REALTIME / XR');
 if(record.roleDetails?.length)add('roleDetails','My role',list(record.roleDetails),'CONTRIBUTION');
 if(record.solutions?.length)add('solutions','Technical solution',`<p class="project-stack-line"><span>Stack</span> ${record.tools.map(escape).join(' · ')}</p><ol class="project-solutions">${record.solutions.map(v=>`<li>${escape(v)}</li>`).join('')}</ol>`,'SYSTEMS');
 const media=record.media||[];
 for(const [key,title,items]of [['interface','Interface & screen systems',media.filter(m=>m.src.includes('/ui/'))],['badges','Badges & motion',media.filter(m=>m.src.includes('/bages/'))],['robot','Robot expressions',media.filter(m=>m.src.includes('/robot-emotions/'))],['locations','Locations & environments',record.locationMedia||[]]])if(items.length)add(key,title,gallery(items));
 const classified=media.filter(m=>!['/ui/','/bages/','/robot-emotions/'].some(key=>m.src.includes(key)));
 if(classified.length)add('more-media','Production media',gallery(classified));
 add('results','Results',`<dl class="project-metrics">${(record.metrics||[]).map(m=>`<div><dt>${escape(m.value)}</dt><dd>${escape(m.label)}</dd></div>`).join('')}</dl>`+list(record.results||[])+`<p>${escape(record.outcome||'')}</p>`,'OUTCOME');
 if(record.awards?.length)add('recognition','Recognition',`<ul>${record.awards.map(a=>`<li><a href="${escape(a.url)}" target="_blank" rel="noopener noreferrer">${escape(a.label)}</a><p>${escape(a.category||'')}</p></li>`).join('')}</ul>`);
 if(record.externalVideo)add('iss','First Woman aboard the ISS',video(record.externalVideo)+`<a href="${escape(record.externalVideo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(record.externalVideo.sourceLabel)}</a>`);
 main.querySelector('.passport-header-right').insertAdjacentHTML('beforeend',field('role',record.role)+field('environment',record.environment));
 const roleList=main.querySelector('#roleDetails .project-record-list');
 if(roleList){
  const items=[...roleList.children],groups=[['Interface & realtime',[0,1]],['Art direction & delivery',[2,5,6,7]],['Motion & character',[3,4]]];
  const grouped=document.createElement('div');grouped.className='project-contribution-groups';
  groups.forEach(([title,indices])=>{const group=document.createElement('div');group.innerHTML=`<h3>${escape(title)}</h3><ul></ul>`;group.querySelector('ul').append(...indices.map(i=>items[i]).filter(Boolean));grouped.append(group);});roleList.replaceWith(grouped);
 }
 const solutionTitles=['UI across spaces','Shader-driven control','Screen atlas automation','Motion & prototyping','Robot expression system','Visual consistency'];
 main.querySelectorAll('.project-solutions>li').forEach((li,i)=>{const text=li.textContent;li.innerHTML=`<h3>${escape(solutionTitles[i]||'Implementation')}</h3><p>${escape(text)}</p>`;});
 const sections=[...main.querySelectorAll('.document-section')];
 const body=document.createElement('div');body.className='article-body project-body';
 const toc=document.createElement('nav');toc.className='atlas-toc';toc.setAttribute('aria-label','Project table of contents');toc.innerHTML='<p class="toc-title">[ TABLE_OF_CONTENTS // NAVIGATION ]</p><ul class="atlas-toc__list">'+entries.map(([id,title],i)=>`<li class="atlas-toc__item"><a href="#${id}"><span class="atlas-toc__num">${String(i+1).padStart(2,'0')}</span><span class="atlas-toc__row"><span class="atlas-toc__title">${escape(title)}</span><span class="atlas-toc__dots"></span></span></a></li>`).join('')+'</ul>';body.append(toc);
 sections.forEach((s,i)=>{
  const header=s.querySelector('.section-label'),title=header.querySelector('h2');title.prepend(`§ ${String(i+1).padStart(2,'0')} `);header.replaceWith(title);
  s.querySelectorAll('h3').forEach(h=>{const mark=document.createElement('span');mark.className='article-subheading-mark';mark.setAttribute('aria-hidden','true');mark.textContent='> ';h.prepend(mark);});
  body.append(s);const end=document.createElement('div');end.className='article-section-divider';end.setAttribute('aria-hidden','true');end.innerHTML=`<span>// § ${String(i+1).padStart(2,'0')}</span>`;body.append(end);
 });main.append(body);
 toc.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const target=document.getElementById(a.hash.slice(1));if(!target)return;e.preventDefault();history.pushState(null,'',a.hash);target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});});
 left.innerHTML='<p class="rail-title">PROJECT.md</p><nav aria-label="Project sections"><a href="?page=projects">← Projects index</a>'+entries.map(([id,title],i)=>`<a href="#${id}">${String(i+1).padStart(2,'0')} ${escape(title)}</a>`).join('')+'</nav>';
 main.querySelectorAll('.project-slider').forEach(slider=>{
  const slides=[...slider.querySelectorAll('.project-media')];let active=0;
  slider.setAttribute('aria-label',slider.closest('section').querySelector('h2').textContent+' — image gallery');
  const show=index=>{active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==active;slide.inert=i!==active;});slider.querySelector('output').textContent=`${active+1} / ${slides.length}`;};
  slider.querySelector('[data-prev]').addEventListener('click',()=>show(active-1));slider.querySelector('[data-next]').addEventListener('click',()=>show(active+1));
  slider.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(active+(e.key==='ArrowLeft'?-1:1));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();show(e.key==='Home'?0:slides.length-1);}});
  show(0);
 });
 const relatedProjects=projects.filter(p=>p.id!==record.id&&(p.metaType===record.metaType||p.stack.engine===record.stack.engine)).slice(0,3);
 const topics=record.tools.map(t=>t.toLowerCase());
 const relatedPosts=posts.filter(p=>p.state==='published'&&p.indexable!==false&&!p.resource&&p.tags?.some(t=>topics.includes(t.toLowerCase()))).sort((a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0)).slice(0,4);
 const links=(label,items)=>`<div class="meta-block article-related"><p>${escape(label)}</p><ul>${items.map(([url,title])=>`<li><a href="${escape(url)}">${escape(title)}</a></li>`).join('')}</ul></div>`;
 right.innerHTML=links('[RELATED PROJECTS]',relatedProjects.map(p=>['/projects/'+p.slug+'/',p.title]))+links('[RELATED NOTES]',relatedPosts.map(p=>[p.localPath||p.publicUrl,p.title]));
}
