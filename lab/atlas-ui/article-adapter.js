import {mediaSlider} from './artwork-gallery.js?v=review-148';
import {setupMediaSliders} from './media-slider.js?v=review-148';
import {adaptArticleStructures} from './article-structures.js?v=review-162';
import {setupCodeFrames} from './code-frame.js?v=review-159';
import {setupTableFrames} from './table-frame.js?v=review-166';
// Adapt existing article structures to approved faces, retaining source content.
export function extractArticleBody(source){
 const container=source.querySelector('.atlas-container');
 const body=document.createElement('div');body.className='article-body';
 if(container)body.append(...container.cloneNode(true).childNodes);
 else source.querySelectorAll('.content-block').forEach(block=>body.append(...block.cloneNode(true).childNodes));
 body.querySelectorAll('script,style,link,#site-passport,#atlas-footer,.atlas-section-break').forEach(node=>node.remove());
 adaptArticleStructures(body);
 body.querySelectorAll('[style]').forEach(node=>node.removeAttribute('style'));
 // Older articles use many sibling blocks; flatten them without dropping content.
 body.querySelectorAll('.content-block').forEach(block=>block.replaceWith(...block.childNodes));
 return body;
}
export function adaptArticle(body,escape,{groupAdjacentImages=false,record=null}={}){
 if(groupAdjacentImages){
  const eligible=node=>node?.matches('.media-frame:not([id])')&&node.querySelectorAll('img').length===1&&!node.querySelector('video,iframe,svg,.project-slider');
  for(const first of [...body.children]){
   if(!eligible(first)||!body.contains(first))continue;
   const frames=[first];let next=first.nextElementSibling;while(eligible(next)){frames.push(next);next=next.nextElementSibling;}
   if(frames.length<2)continue;
   const group=document.createElement('div');group.className='gallery-grid';first.before(group);
   for(const frame of frames){const img=frame.querySelector('img'),caption=frame.querySelector('figcaption,.media-caption');if(caption)img.dataset.caption=caption.textContent.trim();group.append(img);frame.remove();}
  }
 }
 body.querySelectorAll('[data-slider],[data-image-slider],.gallery-grid').forEach(host=>{
  if(!body.contains(host)||host.closest('.project-slider'))return;
  const images=[...host.querySelectorAll('img')];if(!images.length)return;
  const caption=host.querySelector('figcaption,.media-caption');
  const wrapper=document.createElement('div');wrapper.innerHTML=mediaSlider(images.map(img=>({src:img.getAttribute('src'),alt:img.alt,caption:img.dataset.caption||img.closest('figure')?.querySelector('figcaption')?.textContent||img.alt})),escape);
  const slider=wrapper.firstElementChild;if(host.id)slider.id=host.id;host.replaceWith(slider);
  if(caption){const description=document.createElement('p');description.className='media-caption';description.append(...caption.childNodes);slider.after(description);}
 });
 body.querySelectorAll('.atlas-download-btn').forEach(link=>{link.classList.remove('atlas-download-btn');link.classList.add('button');});
 body.querySelectorAll('.atlas-download-wrap a[href]').forEach(link=>{const url=new URL(link.getAttribute('href'),location.href);if(url.hostname==='gumroad.com'||url.hostname.endsWith('.gumroad.com')){link.textContent='Buy on Gumroad';link.target='_blank';link.rel='noopener';if(record){const copy=document.createElement('div');copy.className='atlas-download-copy';const title=document.createElement('strong');title.textContent=record.title;copy.append(title);if(record.summary){const description=document.createElement('span');description.textContent=record.summary;copy.append(description);}link.before(copy);}}});
 body.querySelectorAll('pre').forEach(pre=>pre.classList.add('atlas-code-block'));
 body.querySelectorAll('table').forEach(table=>{table.classList.add('atlas-table');if(!table.closest('.atlas-table-frame')){const frame=document.createElement('div');frame.className='atlas-table-frame';table.before(frame);frame.append(table);}});
 setupMediaSliders(body);
 setupTableFrames(body);
 setupCodeFrames(body);
}

// Retain the article's existing code/math renderers, never its legacy CSS or shell.
export async function enhanceArticle(source,body){
 const urls=[...source.querySelectorAll('script[src]')].map(script=>script.getAttribute('src')).filter(src=>/^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/1\.29\.0\//.test(src)||src==='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js');
 if(!urls.length)return;
 window.Prism=window.Prism||{manual:true};
 if(urls.some(url=>url.includes('mathjax')))window.MathJax={tex:{inlineMath:[['\\(','\\)']],displayMath:[['$$','$$'],['\\[','\\]']]},options:{enableMenu:false}};
 try{
  for(const src of urls)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('Article renderer unavailable'));document.head.append(script);});
  window.Prism?.highlightAllUnder?.(body);
  if(window.MathJax?.startup?.promise)await window.MathJax.startup.promise;
  body.dataset.enhancement='ready';
 }catch{body.dataset.enhancement='unavailable';const note=document.createElement('p');note.className='notice notice--warning';note.textContent='Code and formulas are preserved as text; optional syntax/math rendering is unavailable.';body.append(note);}
}
