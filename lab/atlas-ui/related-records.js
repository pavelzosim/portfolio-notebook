// One compact native-link card face for tool, project and article afterwords.
export function selectRelatedProjects(current,records){
 const engine=record=>(record.stack?.engine||'').toLowerCase().split(/\s+/)[0];
 const tools=new Set((current.tools||[]).map(tool=>tool.toLowerCase()));
 const score=record=>(record.metaType===current.metaType?10:0)+(engine(record)&&engine(record)===engine(current)?5:0)+(record.tools||[]).filter(tool=>tools.has(tool.toLowerCase())).length;
 return records.filter(record=>record.id!==current.id).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)).slice(0,2);
}
export function selectRelatedArticles(current,records,referenceSlugs=[]){
 const score=record=>{const reference=referenceSlugs.indexOf(record.slug);return(reference>=0?100-reference:0)+(record.group===current.group?10:0)+(record.tags||[]).filter(tag=>(current.tags||[]).includes(tag)).length;};
 return records.filter(record=>record.id!==current.id&&record.state==='published'&&record.indexable!==false&&!record.resource).sort((a,b)=>score(b)-score(a)||(Date.parse(b.siteDate||b.datePublished)||0)-(Date.parse(a.siteDate||a.datePublished)||0)).slice(0,2);
}
export function relatedRecords(records,escape,{prefix='related'}={}){
 return `<div class="tool-related-grid">${records.map((record,i)=>`<a class="tool-related-card" href="${escape(record.localPath||record.publicUrl||record.sourceUrl)}" aria-labelledby="${prefix}-${i}"><span class="tool-related-preview"><img src="${escape(record.image)}" alt="${escape(record.imageAlt||record.title)}" loading="lazy"></span><div><span class="eyebrow">${escape(record.id)}</span><h3 id="${prefix}-${i}">${escape(record.title)}</h3><p>${escape(record.summary||'')}</p><span class="record-arrow" aria-hidden="true">open →</span></div></a>`).join('')}</div>`;
}
