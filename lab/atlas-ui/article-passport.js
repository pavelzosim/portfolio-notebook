const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderArticlePassport(host,record,{heading='h1'}={}){
 host.classList.add('article-passport');
 const date=value=>String(value||'').replaceAll('-','.');
 const fields=[['log_id',record.id],['project',record.group],['auth','Pavel Zosim'],['created',date(record.datePublished)],['revision',record.version||date(record.dateModified)]];
 const field=([key,value])=>`<span class="passport-header-field"><span class="passport-header-key">${escape(key)}:</span> ${escape(value)}</span>`;
 host.innerHTML=`<div class="passport-title-bar"><div class="passport-header-left">${fields.slice(0,2).map(field).join('')}</div><div class="passport-header-right">${fields.slice(2).map(field).join('')}</div></div><${heading} class="passport-heading">${escape(record.title)}</${heading}><div class="passport-tags">${record.tags.map(t=>`<a href="?page=blog&amp;q=${encodeURIComponent(t)}">#${escape(t)}</a>`).join('')}</div><p class="passport-summary">Summary: ${escape(record.summary)}</p>`;
}
