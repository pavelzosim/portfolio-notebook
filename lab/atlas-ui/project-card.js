export function renderProjectCards(target,records,{sourceHome,prefix='project'}={}){
 target.replaceChildren();
 for(const record of records){
  const card=document.createElement('a');card.className='highlight-card';card.id=`${prefix}-${record.slug}`;card.href=record.slug==='nasa-first-woman'?'?page=project':`/projects/${record.slug}/`;
  const image=document.createElement('img');image.src=record.image;image.alt=record.title;image.loading='lazy';
  const meta=document.createElement('div');meta.className='highlight-meta';
  const append=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;node.textContent=text;meta.append(node);return node;};
  append('span','highlight-kind',`${record.id} / ${record.type}`);const title=append('h3','',record.title);title.id=`${prefix}-title-${record.id}`;card.setAttribute('aria-labelledby',title.id);
  append('p','',record.summary);append('small','',record.role);append('small','',record.environment);
  const original=sourceHome?.querySelector(`.project-records a[href="/projects/${record.slug}/"] .highlight-award`);
  const achievement=original?.textContent||record.reach?.recognition||(record.awards||[]).map(a=>a.label).join(' · ')||(record.reach?.runtime?`${record.reach.runtime} operation · ${record.reach.state}`:'');
  if(achievement)append('span','highlight-award project-achievement',achievement);
  append('span','record-arrow','open →').setAttribute('aria-hidden','true');card.append(image,meta);target.append(card);
 }
}
