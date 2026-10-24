import {mediaSlider} from './artwork-gallery.js?v=review-148';
import {setupMediaSliders} from './media-slider.js?v=review-148';
import {adaptArticleStructures} from './article-structures.js?v=review-149';
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
export function adaptArticle(body,escape){
 body.querySelectorAll('[data-slider],[data-image-slider]').forEach(host=>{
  const images=[...host.querySelectorAll('img[data-slide]')];if(!images.length)return;
  const wrapper=document.createElement('div');wrapper.innerHTML=mediaSlider(images.map(img=>({src:img.getAttribute('src'),alt:img.alt,caption:img.dataset.caption||img.alt})),escape);host.replaceWith(wrapper.firstElementChild);
 });
 body.querySelectorAll('.atlas-download-btn').forEach(link=>{link.classList.remove('atlas-download-btn');link.classList.add('button');});
 body.querySelectorAll('pre').forEach(pre=>pre.classList.add('atlas-code-block'));
 body.querySelectorAll('table').forEach(table=>{table.classList.add('atlas-table');if(!table.closest('.atlas-table-frame')){const frame=document.createElement('div');frame.className='atlas-table-frame';table.before(frame);frame.append(table);}});
 setupMediaSliders(body);
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
