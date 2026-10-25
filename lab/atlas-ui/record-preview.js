export function renderRecordPreviews(target,records,{limit=4}={}){
 target.replaceChildren();
 for(const record of records.filter(r=>r.image).slice(0,limit)){
  const card=document.createElement('a');card.className='highlight-card';card.href=record.localPath||record.publicUrl||record.sourceUrl;
  const image=document.createElement('img');image.src=record.image;image.alt=record.imageAlt||record.title;image.loading='lazy';
  const meta=document.createElement('span');meta.className='highlight-meta';
  for(const [tag,cls,text]of [['span','highlight-kind',record.group.toUpperCase()],['strong','',record.title],['small','',record.tags.slice(0,3).join(' · ')]]){const node=document.createElement(tag);node.className=cls;node.textContent=text;meta.append(node);}card.append(image,meta);target.append(card);
 }
}
