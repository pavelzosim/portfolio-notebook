// Same canonical URL and copy behaviour for every share block.
export function addShareControls(section,url,{embed=false}={}){
 if(section.dataset.shareReady)return;section.dataset.shareReady='true';
 const nav=section.querySelector('nav');if(!nav)return;
 if(!nav.querySelector('a[href*="twitter.com"],a[href*="x.com"]')){const x=document.createElement('a');x.href='https://twitter.com/intent/tweet?url='+encodeURIComponent(url);x.textContent='[x]';x.target='_blank';x.rel='noopener noreferrer';nav.append(x);}
 const status=document.createElement('p');status.className='eyebrow';status.setAttribute('role','status');
 const fallback=document.createElement('textarea');fallback.className='share-copy-field';fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','Copy content');
 for(const [label,value]of [['[copy link]',url],...(embed?[['[embed]',`<iframe src="${url}" title="Style Guide" loading="lazy"></iframe>`]]:[])]){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);status.textContent=label==='[embed]'?'Embed code copied.':'Link copied.';fallback.hidden=true;}catch{fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();status.textContent='Select and copy the content below.';}});nav.append(button);}
 nav.after(status,fallback);
}
export function createShareSection(url,{embed=false}={}){
 const section=document.createElement('section');section.className='article-share';section.setAttribute('aria-label','Share this record');
 const header=document.createElement('div');header.className='article-share-header';header.textContent='[SHARE]';
 const body=document.createElement('div');body.className='article-share-body';const nav=document.createElement('nav');nav.setAttribute('aria-label','Share links');
 for(const [label,destination]of [['linkedin','https://www.linkedin.com/sharing/share-offsite/?url='],['facebook','https://www.facebook.com/sharer/sharer.php?u=']]){const link=document.createElement('a');link.href=destination+encodeURIComponent(url);link.textContent=`[${label}]`;link.target='_blank';link.rel='noopener noreferrer';nav.append(link);}
 body.append(nav);section.append(header,body);addShareControls(section,url,{embed});return section;
}
