export function setupArticleNavigation(root){
 root.querySelectorAll('.atlas-toc').forEach(toc=>{
  if(!toc.querySelector('.toc-title')){const title=document.createElement('p');title.className='toc-title';title.textContent='[ TABLE_OF_CONTENTS // NAVIGATION ]';toc.prepend(title);}
  if(toc.dataset.ready)return;toc.dataset.ready='true';
  toc.addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const target=root.querySelector('#'+CSS.escape(link.hash.slice(1)));if(!target)return;event.preventDefault();history.pushState(null,'',link.hash);target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});});
 });
 root.querySelectorAll('.atlas-ref-item').forEach(row=>{
  const link=row.querySelector('.atlas-ref-link');if(!link||link.classList.contains('atlas-ref-row-link'))return;
  const text=document.createElement('span');text.textContent=link.textContent;link.replaceWith(text);link.classList.add('atlas-ref-row-link');link.replaceChildren(...row.childNodes);row.append(link);
 });
}
