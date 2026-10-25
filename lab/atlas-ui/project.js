/* Complete project candidate, sourced exclusively from the local registry. */
import {setupMediaSliders} from './media-slider.js?v=review-148';
import {projectMetrics} from './project-metrics.js?v=review-142';
import {setupArticleNavigation} from './article-navigation.js?v=review-177';
import {setupMediaTabs,renderMediaTabs} from './media-tabs.js?v=review-180';
import {videoFrame} from './video-frame.js?v=review-180';
import {artworkGallery} from './artwork-gallery.js?v=review-180';
import {projectMediaThemes} from './project-media.js?v=review-152';
import {relatedRecords,selectRelatedProjects} from './related-records.js?v=review-157';
export function renderProject({record,layout={},projects=[],posts=[],main,left,right,escape,heading,section,facts}){
 const entries=[];
 const add=(id,title,body,label='')=>{main.insertAdjacentHTML('beforeend',section(id,title,body));const header=main.lastElementChild.querySelector('.section-label');header.querySelector('span').textContent=`§ ${String(entries.length+1).padStart(2,'0')}`;if(label)header.insertAdjacentHTML('beforeend',`<em>${escape(label)}</em>`);entries.push([id,title]);};
 const list=values=>`<ul class="project-record-list">${values.map(v=>`<li>${escape(v)}</li>`).join('')}</ul>`;
 const video=(v,id='project-video')=>videoFrame({...v,poster:v.poster||record.image},escape,{id});
 const field=(key,value)=>`<span class="passport-header-field"><span class="passport-header-key">${escape(key)}:</span> ${escape(value)}</span>`;
 main.innerHTML=`<header class="document-head article-passport"><div class="passport-title-bar"><div class="passport-header-left">${field('log_id',record.id)}</div><div class="passport-header-right">${field('client',record.client)}${field('status',record.status)}${field('role',record.role)}${field('environment',record.environment||'')}</div></div><h1>${escape(record.title)}</h1><p class="passport-summary">Summary: ${escape(record.summary)}</p><div class="passport-tags">${record.tools.map(tool=>`<a href="?page=blog&tag=${encodeURIComponent(tool.toLowerCase())}">${escape(tool)}</a>`).join('')}</div></header>`;
 const openingVideo=record.videos?.length?renderMediaTabs(record.videos.map(v=>({id:v.id,title:v.title,html:video(v,v.id)})),escape,{label:'Project videos'}):(record.video?video(record.video,'opening-video'):'');
 add('overview','Overview',`<p class="project-overview">${escape(record.overview)}</p><div class="project-opening">${openingVideo}${projectMetrics(record.metrics||[],escape)}</div>`);
 add('context','Scope & constraints',`<div class="project-context"><div><h3>Scope</h3><div class="comp-body"><ul>${(record.scope||[]).map(v=>`<li>${escape(v)}</li>`).join('')}</ul></div></div><div><h3>Constraints</h3><div class="comp-body"><ul>${(record.constraints||[]).map(v=>`<li>${escape(v)}</li>`).join('')}</ul></div></div></div>`);
 const themes=projectMediaThemes(record);
 if(themes.length)add('artwork','Artwork & environments',artworkGallery(themes,escape));
 if(record.roleDetails?.length)add('roleDetails','My role',list(record.roleDetails),'CONTRIBUTION');
 if(record.solutions?.length)add('solutions','Technical solution',`<ol class="project-solutions">${record.solutions.map(v=>`<li>${escape(v)}</li>`).join('')}</ol>`,'SYSTEMS');
 // Metrics, award evidence and the ISS appearance form one concise record.
 const recognitionFacts=record.slug==='nasa-first-woman'?(record.results||[]).filter(text=>!/1\.5 million|325K|350K|Frank Rubio|Webby|People.s Voice/i.test(text)):[...(record.results||[]),...(record.outcome?[record.outcome]:[])];
 const awards=(record.awards||[]).map(a=>`<tr><th scope="row">Award</th><td><a href="${escape(a.url)}" target="_blank" rel="noopener noreferrer">${escape(a.label)}</a>${a.category?`<br>${escape(a.category)}`:''}</td></tr>`).join('');
 const issFact=record.externalVideo?(record.results||[]).find(text=>/Frank Rubio|aboard the ISS/i.test(text)):'';
 const recognitionRows=awards+(issFact?`<tr><th scope="row">ISS</th><td>${escape(issFact)}</td></tr>`:'')+(recognitionFacts.length?`<tr><th scope="row">Use & longevity</th><td><ul>${recognitionFacts.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></td></tr>`:'');
 const recognitionTable=recognitionRows?`<div class="atlas-table-frame atlas-table-frame--solid"><div class="atlas-table-header-solid">[ RECOGNITION // PRODUCTION RECORD ]</div><table class="atlas-table" aria-label="Project recognition and use"><tbody>${recognitionRows}</tbody></table></div>`:'';
 add('recognition','Recognition',recognitionTable+(record.externalVideo?video(record.externalVideo,'recognition-video'):''));
 const roleList=main.querySelector('#roleDetails .project-record-list');
 if(roleList&&layout.roleGroups?.length){
  const items=[...roleList.children],used=new Set();
  const grouped=document.createElement('div');grouped.className='project-contribution-groups';
  layout.roleGroups.forEach(({title,items:values})=>{const matches=items.filter(item=>values.includes(item.textContent)&&!used.has(item));if(!matches.length)return;matches.forEach(item=>used.add(item));const group=document.createElement('article');group.className='card';group.innerHTML=`<h3 class="eyebrow">${escape(title)}</h3><ul></ul>`;group.querySelector('ul').append(...matches);grouped.append(group);});const rest=items.filter(item=>!used.has(item));if(rest.length){const remaining=document.createElement('ul');remaining.append(...rest);grouped.append(remaining);}roleList.replaceWith(grouped);
 }
 main.querySelectorAll('.project-contribution-groups>.card').forEach(group=>group.classList.remove('card'));
 main.querySelectorAll('.project-solutions>li').forEach(li=>{const text=li.textContent,title=layout.solutionHeadings?.[text];li.innerHTML=`<div>${title?`<h3>${escape(title)}</h3>`:''}<p>${escape(text)}</p></div>`;});
 const sections=[...main.querySelectorAll('.document-section')];
 const body=document.createElement('div');body.className='article-body project-body';
 const toc=document.createElement('nav');toc.className='atlas-toc';toc.setAttribute('aria-label','Project table of contents');toc.innerHTML='<p class="toc-title">[ TABLE_OF_CONTENTS // NAVIGATION ]</p><ul class="atlas-toc__list">'+entries.map(([id,title],i)=>`<li class="atlas-toc__item"><a href="#${id}"><span class="atlas-toc__num">${String(i+1).padStart(2,'0')}</span><span class="atlas-toc__row"><span class="atlas-toc__title">${escape(title)}</span><span class="atlas-toc__dots"></span></span></a></li>`).join('')+'</ul>';body.append(toc);
 sections.forEach((s,i)=>{
  const header=s.querySelector('.section-label'),title=header.querySelector('h2');title.prepend(`§ ${String(i+1).padStart(2,'0')} `);header.replaceWith(title);
  s.querySelectorAll('h3').forEach(h=>{const mark=document.createElement('span');mark.className='article-subheading-mark';mark.setAttribute('aria-hidden','true');mark.textContent='> ';h.prepend(mark);});
  body.append(s);
  const end=document.createElement('div');end.className='article-section-divider';end.setAttribute('aria-hidden','true');end.innerHTML=`<span>// § ${String(i+1).padStart(2,'0')}</span>`;body.append(end);
 });
 body.insertAdjacentHTML('beforeend','<div class="atlas-eof-divider"><span class="atlas-eof-divider__line"></span><span class="atlas-eof-divider__meta">// END OF ARTICLE // EOF</span><span class="atlas-eof-divider__line"></span></div>');main.append(body);
 left.innerHTML='<p class="rail-title">PROJECT.md</p><nav aria-label="Project sections"><a href="?page=projects">← Projects index</a>'+entries.map(([id,title],i)=>`<a href="#${id}">${String(i+1).padStart(2,'0')} ${escape(title)}</a>`).join('')+'</nav>';
 setupMediaSliders(main);setupMediaTabs(main);setupArticleNavigation(main);
 const relatedProjects=selectRelatedProjects(record,projects);
 if(relatedProjects.length)main.insertAdjacentHTML('beforeend',section('related-records','Related records',relatedRecords(relatedProjects.slice(0,2).map(project=>({...project,localPath:`?page=project&slug=${encodeURIComponent(project.slug)}`})),escape,{prefix:'project-related'})));
 const topics=record.tools.map(t=>t.toLowerCase());
 const relatedPosts=posts.filter(p=>p.state==='published'&&p.indexable!==false&&!p.resource&&p.tags?.some(t=>topics.includes(t.toLowerCase()))).sort((a,b)=>(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0)).slice(0,3);
 const links=(label,items)=>`<div class="meta-block article-related"><p>${escape(label)}</p><ul>${items.map(([url,title])=>`<li><a href="${escape(url)}">${escape(title)}</a></li>`).join('')}</ul></div>`;
 right.innerHTML=facts('[RECORD]',[['id',record.id],['client',record.client],['status',record.status],['role',record.role]])+facts('[STACK]',Object.entries(record.stack))+links('[RELATED]',[...relatedProjects.map(p=>['/projects/'+p.slug+'/',p.title]),...relatedPosts.map(p=>[p.localPath||p.publicUrl,p.title])]);
}
