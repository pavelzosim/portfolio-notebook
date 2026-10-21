/* Full resource index. The registry owns content; shared components own styling. */
export function matchesResource(record,{kind='all',platform='all',query=''}={}){
 const tags=(record.tags||[]).map(tag=>tag.toLocaleLowerCase());
 return (kind==='all'||record.kind===kind)&&(platform==='all'||tags.includes(platform))&&[record.title,record.summary,...tags].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export async function renderTools({main,left,right,registry,escape,heading}){
 // Candidate-only preview from the article's workflow video (n_h78ddRw3k).
 const records=registry.records.filter(r=>r.resource&&r.state==='published'&&r.indexable!==false).map(r=>r.id==='TOOL-003'&&!r.image?{...r,image:'./material-path-manager.jpg',imageAlt:'Houdini Material Path Manager — workflow demonstration'}:r);
 const params=new URLSearchParams(location.search);
 let kind=['tool','asset'].includes(params.get('kind'))?params.get('kind'):'all';
 let platform=['cli','houdini'].includes(params.get('platform'))?params.get('platform'):'all';
 let sort=params.get('sort')==='title'?'title':'newest';
 main.innerHTML=heading('Tools and assets','tools / resource index','Utilities, procedural systems, scripts, and real-time assets. Each record includes implementation context instead of functioning as a download wall.')+
 '<section class="document-section"><form class="resource-search" role="search"><label for="resource-query">Filter records</label><input id="resource-query" type="search" autocomplete="off" placeholder="Title, tool or tag" aria-describedby="resource-count"><label class="sort-label" for="resource-sort">Sort</label><select id="resource-sort"><option value="newest">Newest first</option><option value="title">Title A–Z</option></select><output id="resource-count" role="status"></output></form></section><div id="resource-results"></div>';
 left.innerHTML='<p class="rail-title">TOOLS_INDEX.md</p><nav aria-label="Resource sections"><a href="?page=tools" aria-current="page">00 Index</a><a href="#resources-tool">01 Tools</a><a href="#resources-asset">02 Assets</a></nav><div class="resource-filters" role="group" aria-label="Filter by resource type"><p class="eyebrow">TYPE</p><button type="button" data-kind="all">All</button><button type="button" data-kind="tool">Tools</button><button type="button" data-kind="asset">Assets</button></div>';
 const platforms=document.createElement('div');platforms.className='resource-platform';platforms.setAttribute('role','group');platforms.setAttribute('aria-label','Filter by platform');platforms.innerHTML='<span class="eyebrow">Platform</span><button class="filter-chip" type="button" data-platform="all">All</button><button class="filter-chip" type="button" data-platform="cli">CLI</button><button class="filter-chip" type="button" data-platform="houdini">Houdini</button><button class="filter-chip" type="button" data-platform="unreal" disabled title="Planned — no published Unreal tools">Unreal <small>Planned</small></button><button class="filter-chip" type="button" data-platform="unity" disabled title="Planned — no published Unity tools">Unity <small>Planned</small></button>';
 main.querySelector('.resource-search').insertBefore(platforms,main.querySelector('#resource-count'));
 left.querySelectorAll('[data-kind]').forEach(button=>button.classList.add('filter-chip'));
 const input=main.querySelector('#resource-query'),sortInput=main.querySelector('#resource-sort'),result=main.querySelector('#resource-results');input.value=params.get('q')||'';sortInput.value=sort;
 const render=()=>{
  const query=input.value.trim().toLocaleLowerCase();
  const matching=records.filter(r=>matchesResource(r,{kind,platform,query}));
  matching.sort(sort==='title'?(a,b)=>a.title.localeCompare(b.title):(a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0));
  result.innerHTML=['tool','asset'].map(type=>{
   const items=matching.filter(r=>r.kind===type);if(!items.length)return '';
   return `<section class="document-section" id="resources-${type}"><header class="section-label"><span>§ ${type==='tool'?'01':'02'}</span><h2>${type==='tool'?'Tools':'Assets'}</h2><em>${items.length} RECORDS</em></header><div class="resource-list">${items.map(r=>`<a class="resource-record" href="${escape(r.localPath||r.publicUrl||r.sourceUrl)}" aria-labelledby="resource-${escape(r.id)}">${r.image?`<img src="${escape(r.image)}" alt="${escape(r.imageAlt||r.title)}" loading="lazy">`:'<span class="resource-placeholder" aria-hidden="true">—</span>'}<div class="resource-copy"><span class="eyebrow">${escape(r.id)} / ${escape(r.kind.toUpperCase())}</span><h3 id="resource-${escape(r.id)}">${escape(r.title)}</h3><p>${escape(r.summary)}</p><span class="resource-tags">${r.tags.map(escape).join(' · ')}</span></div><span class="resource-open" aria-hidden="true">open →</span></a>`).join('')}</div></section>`;
  }).join('');
  if(!matching.length)result.innerHTML='<section class="document-section"><div class="empty-state"><h2>No matching records</h2><p>Try another title or tag, or reset the filters.</p><button class="button button--quiet" type="button" data-reset-resources>Reset filters</button></div></section>';
  result.querySelector('[data-reset-resources]')?.addEventListener('click',()=>{input.value='';kind='all';platform='all';render();input.focus();});
  main.querySelector('#resource-count').textContent=`${matching.length} / ${records.length} records`;
  left.querySelectorAll('[data-kind]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.kind===kind));});
  platforms.querySelectorAll('[data-platform]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.platform===platform)));
  left.querySelectorAll('nav a[href^="#"]').forEach(a=>{a.hidden=!matching.some(r=>a.hash===`#resources-${r.kind}`);});
  const next=new URLSearchParams(location.search);query?next.set('q',input.value.trim()):next.delete('q');kind==='all'?next.delete('kind'):next.set('kind',kind);platform==='all'?next.delete('platform'):next.set('platform',platform);sort==='newest'?next.delete('sort'):next.set('sort',sort);history.replaceState(null,'',`${location.pathname}?${next}${location.hash}`);
  document.dispatchEvent(new Event('atlas:content-updated'));
 };
 input.addEventListener('input',render);sortInput.addEventListener('change',()=>{sort=sortInput.value;render();});main.querySelector('form').addEventListener('submit',e=>{e.preventDefault();render();});
 left.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.kind;render();}));render();
 platforms.querySelectorAll('[data-platform]:not(:disabled)').forEach(button=>button.addEventListener('click',()=>{platform=button.dataset.platform;render();}));
}
