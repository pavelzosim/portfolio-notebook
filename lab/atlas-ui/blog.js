/* Candidate index: content stays in the published registry. */
export function blogChapterHeading(name,count,escape){return `<header class="blog-chapter-heading"><h3>${escape(name)}</h3><span>${count} ${count===1?'record':'records'}</span></header>`;}
export function blogSubcategory(record){
 const tags=(record.tags||[]).map(t=>t.toLowerCase());
 if(record.title.startsWith('From File to Pixel'))return 'From File to Pixel';
 if(record.title.startsWith('Unity ShaderLab Cheatsheet'))return 'Unity ShaderLab Cheatsheet';
 if(record.title.startsWith('C# Variables'))return 'C# Variables — Lesson 1';
 if(record.group==='procedural')return /Resolution/.test(record.title)?'Address & travel resolution':'Level generation & lighting';
 if(record.group==='shaders')return tags.includes('compute')?'Compute shaders':'Shader fundamentals';
 if(record.group==='tools')return tags.includes('houdini')?'Houdini tools':tags.includes('cli')?'CLI & documentation':'Image & texture tools';
 if(record.group==='houdini')return tags.includes('procedural-environments')?'Procedural environments':'Simulation & animation';
 if(record.group==='pipeline')return tags.includes('usd')?'USD workflows':'Houdini → Unreal';
 if(record.group==='vfx')return tags.includes('pyro')?'Pyro & destruction':'Procedural animation';
 if(record.group==='technical-art')return 'Coordinate systems & mathematics';
 if(record.group==='assets')return 'Real-time 3D assets';
 if(record.group==='python-tools')return 'Local CLI workflows';
 return 'Development records';
}
export function renderBlog({main,left,registry,escape,heading}){
 const chapterId=(g,name)=>`blog-volume-${g}-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
 const records=registry.records.filter(r=>r.state==='published'&&r.indexable!==false);
 const params=new URLSearchParams(location.search),groups=[...new Set(records.map(r=>r.group))];
 const labels={foundations:'Foundations',shaders:'Shaders',vfx:'VFX & simulations',pipeline:'Pipeline',procedural:'Procedural systems',tools:'Tools',assets:'Assets','technical-art':'Technical art',archive:'Archive',houdini:'Houdini','python-tools':'Python tools'};
 const summaries={
  foundations:'How data becomes a rendered frame: hardware, graphics pipelines, memory, shaders, and engines.',
  procedural:'Rule-driven environments, lighting, and spatial systems built with Houdini and Unreal Engine.',
  shaders:'Shader references and practical studies in materials, HLSL, and GPU compute.',
  vfx:'Production breakdowns of procedural effects, simulation, and animation.',
  pipeline:'Moving procedural content between Houdini, Unreal Engine, and USD workflows.',
  'technical-art':'Programming lessons and mathematical foundations for technical-art work.',
  houdini:'Houdini studies in simulation, procedural animation, and environment creation.',
  tools:'Reusable production utilities for image processing, documentation, and Houdini workflows.',
  'python-tools':'Local Python utilities and command-line workflows for production tasks.',
  assets:'Reusable 3D models for real-time scenes, visualization, and rendering.',
  archive:'Earlier development notes on gameplay systems and their integration.'
 };
 const ordered=['foundations','procedural','shaders','vfx','pipeline','technical-art','houdini','tools','python-tools','assets','archive'].filter(g=>groups.includes(g));
 let group=groups.includes(params.get('group'))?params.get('group'):'all';
 let platform=['houdini','unreal','unity','foundation'].includes(params.get('platform'))?params.get('platform'):'all';
 main.innerHTML=heading('Technical notes index','blog / index','Long-form technical notes about rendering, procedural systems, shaders, production tooling, and the decisions behind real-time work.')+'<section class="document-section"><form class="resource-search" role="search"><label for="blog-query">Filter records</label><input id="blog-query" type="search" placeholder="Title, topic or tag" aria-describedby="blog-count"><label for="blog-sort">Sort</label><select id="blog-sort"><option value="newest">Newest first</option><option value="title">Title A–Z</option></select><output id="blog-count" role="status"></output></form></section><div id="blog-results"></div>';
 left.innerHTML='<p class="rail-title">BLOG_INDEX.md</p><nav><a href="#blog-records">00 Index</a></nav><div class="resource-filters" role="group" aria-label="Filter by topic"><p class="eyebrow">TOPIC</p>'+['all',...groups].map(g=>`<button type="button" class="filter-chip" data-group="${escape(g)}">${escape(g==='all'?'All':g.replaceAll('-',' '))}</button>`).join('')+'</div>';
 const query=main.querySelector('#blog-query'),sort=main.querySelector('#blog-sort'),results=main.querySelector('#blog-results');query.value=params.get('q')||'';sort.value=params.get('sort')==='title'?'title':'newest';
 const platforms=document.createElement('div');platforms.className='resource-platform';platforms.setAttribute('role','group');platforms.setAttribute('aria-label','Filter by platform or foundations');
 platforms.innerHTML=['All','Houdini','Unreal','Unity','Foundation'].map(label=>`<button type="button" class="filter-chip" data-platform="${label.toLowerCase()}">${label}</button>`).join('');
 main.querySelector('form').insertBefore(platforms,main.querySelector('#blog-count'));
 platforms.append(main.querySelector('#blog-count'));
 const render=()=>{
  const q=query.value.trim().toLocaleLowerCase();
  const matches=records.filter(r=>(group==='all'||r.group===group)&&(platform==='all'||(platform==='foundation'?r.group==='foundations':r.tags.some(t=>t.toLowerCase()===platform||(platform==='unreal'&&t.toLowerCase()==='unreal engine'))))&&[r.title,r.summary,...r.tags].join(' ').toLocaleLowerCase().includes(q));
  matches.sort(sort.value==='title'?(a,b)=>a.title.localeCompare(b.title):(a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0));
  results.innerHTML=`<section class="document-section" id="blog-records"><header class="section-label"><span>§ 01</span><h2>Breakdowns, lessons and R&amp;D</h2><em>${matches.length} RECORDS</em></header><div class="home-records">${matches.map(r=>`<a href="${r.localPath==='/content/posts/atlas-html/procedural-travel-resolution.html'?'?page=article':escape(r.localPath||r.publicUrl||r.sourceUrl)}" aria-labelledby="blog-${escape(r.id)}"><span class="record-date">${escape((r.siteDate||r.datePublished||'').slice(0,7).replace('-','.'))}</span><span class="record-kind">${escape(r.kind.toUpperCase())}</span><span class="record-main"><strong id="blog-${escape(r.id)}">${escape(r.title)}</strong><span class="record-summary">${escape(r.summary)}</span><span class="record-tags">${r.tags.map(escape).join(' · ')}</span></span><span class="record-arrow" aria-hidden="true">→</span></a>`).join('')}</div>${matches.length?'':'<div class="empty-state"><h3>No matching records</h3><p>Try another title or tag.</p><button type="button" class="button button--quiet" data-reset>Reset filters</button></div>'}</section>`;
  main.querySelector('#blog-count').textContent=`${matches.length} / ${records.length} records`;
  // Keep the existing row component; partition it into stable, navigable volumes.
  if(matches.length){
   const rows=[...results.querySelectorAll('.home-records>a')];
   const sections=ordered.map((g,index)=>{
    const items=matches.map((record,i)=>({record,row:rows[i]})).filter(item=>item.record.group===g);
    if(!items.length)return null;
    const section=document.createElement('section');section.className='document-section';section.id=`blog-volume-${g}`;
    section.innerHTML=`<header class="section-label"><span>§ ${String(index+1).padStart(2,'0')}</span><h2>${escape(labels[g]||g)}</h2><em>${items.length} RECORDS</em></header><p class="section-intro">${escape(summaries[g]||'')}</p><div class="home-records"></div>`;
    const subgroups=[...new Set(items.map(item=>blogSubcategory(item.record)))];
    const container=section.querySelector('.home-records');container.remove();
    subgroups.forEach((name,subindex)=>{
     const subset=items.filter(item=>blogSubcategory(item.record)===name);
     const chapter=document.createElement('div');chapter.className='blog-chapter';chapter.id=chapterId(g,name);
     chapter.innerHTML=blogChapterHeading(name,subset.length,escape)+'<div class="home-records"></div>';
     chapter.querySelector('.home-records').append(...subset.map(item=>item.row));section.append(chapter);
    });return section;
   }).filter(Boolean);
   results.replaceChildren(...sections);
  }
  left.querySelector('nav').innerHTML='<a href="#blog-results">00 Index</a>'+ordered.map((g,index)=>{
   const count=matches.filter(r=>r.group===g).length;
   const chapters=[...results.querySelectorAll(`#blog-volume-${g} .blog-chapter`)];
   return count?`<a href="#blog-volume-${escape(g)}">${String(index+1).padStart(2,'0')} ${escape(labels[g]||g)} · ${count}</a>`+chapters.map(ch=>`<a class="blog-subnav" href="#${ch.id}">${escape(ch.querySelector('h3').textContent)}</a>`).join(''):'';
  }).join('');
  left.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
  platforms.querySelectorAll('[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.platform===platform)));
  results.querySelector('[data-reset]')?.addEventListener('click',()=>{group='all';platform='all';query.value='';render();query.focus();});
  const next=new URLSearchParams(location.search);q?next.set('q',query.value.trim()):next.delete('q');group==='all'?next.delete('group'):next.set('group',group);sort.value==='title'?next.set('sort','title'):next.delete('sort');history.replaceState(null,'',`${location.pathname}?${next}${location.hash}`);
  document.dispatchEvent(new Event('atlas:content-updated'));
  const state=new URL(location.href);platform==='all'?state.searchParams.delete('platform'):state.searchParams.set('platform',platform);history.replaceState(null,'',state);
 };
 query.addEventListener('input',render);sort.addEventListener('change',render);main.querySelector('form').addEventListener('submit',e=>e.preventDefault());left.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;render();}));render();
 platforms.querySelectorAll('[data-platform]').forEach(b=>b.addEventListener('click',()=>{platform=b.dataset.platform;render();}));
}
