// Same canonical URL and copy behaviour for every share block.
export function addShareControls(section,url,{embed=false}={}){
 const nav=section.querySelector('nav');if(!nav)return;
 if(!nav.querySelector('a[href*="twitter.com"],a[href*="x.com"]')){const x=document.createElement('a');x.href='https://twitter.com/intent/tweet?url='+encodeURIComponent(url);x.textContent='[x]';x.target='_blank';x.rel='noopener noreferrer';nav.append(x);}
 const status=document.createElement('p');status.className='eyebrow';status.setAttribute('role','status');
 const fallback=document.createElement('textarea');fallback.className='share-copy-field';fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','Copy content');
 for(const [label,value]of [['[copy link]',url],...(embed?[['[embed]',`<iframe src="${url}" title="Style Guide" loading="lazy"></iframe>`]]:[])]){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);status.textContent=label==='[embed]'?'Embed code copied.':'Link copied.';fallback.hidden=true;}catch{fallback.value=value;fallback.hidden=false;fallback.focus();fallback.select();status.textContent='Select and copy the content below.';}});nav.append(button);}
 nav.after(status,fallback);
}
