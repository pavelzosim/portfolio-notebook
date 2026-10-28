import {withResourceMedia} from './resource-media.js?v=review-137';
import {readSourceDocument} from './source-document.js';
// Published tool registry + each tool's own purchase link are the source of truth.
let productsPromise;
let onlinePromise;
async function populateOnline(root){
 const shelves=[...root.querySelectorAll('[data-online-tools-shelf]')];if(!shelves.length)return;
 onlinePromise??=fetch('/content/online-tools/index.json').then(response=>response.json()).then(data=>data.records.filter(record=>record.state==='published'&&record.indexable!==false));
 const records=await onlinePromise;
 for(const shelf of shelves){if(shelf.dataset.onlinePopulated)continue;shelf.dataset.onlinePopulated='true';const viewport=shelf.querySelector('.gumroad-shelf__viewport'),limit=Number(shelf.dataset.catalogueLimit)||records.length;viewport.replaceChildren();for(const record of records.slice(0,limit)){const slide=document.createElement('a');slide.className='gumroad-shelf__slide';slide.href=record.publicUrl;const image=document.createElement('img');image.src=record.image;image.alt=record.imageAlt;image.loading='lazy';const title=document.createElement('strong');title.textContent=record.title;const text=document.createElement('span');text.textContent=record.summary;const availability=document.createElement('em');availability.innerHTML='<b>FREE</b><i>LOCAL</i>';slide.append(image,title,text,availability);viewport.append(slide);}}
}
export function loadStoreTools(){
 return productsPromise??=(async()=>{
  const response=await fetch('/content/posts/index.json');if(!response.ok)throw Error('Tool registry unavailable');
  const {records}=await response.json();
  const products=await Promise.all(records.filter(r=>r.kind==='tool'&&r.resource&&r.state==='published'&&r.indexable!==false).map(async record=>{
   const source=await readSourceDocument(record.localPath);
   const link=[...source.querySelectorAll('.atlas-download-btn[href]')].find(a=>{try{const url=new URL(a.getAttribute('href'),location.origin);return url.hostname==='pavelzosim.gumroad.com'&&url.pathname.startsWith('/l/');}catch{return false;}});
   return link?{...withResourceMedia(record),purchaseUrl:link.href}:null;
  }));return products.filter(Boolean);
 })();
}
async function populateStore(root){
 const shelves=[...root.querySelectorAll('[data-gumroad-shelf]')];if(!shelves.length)return;
 const products=await loadStoreTools();
 for(const shelf of shelves){if(shelf.dataset.storePopulated)continue;shelf.dataset.storePopulated='true';
  const viewport=shelf.querySelector('.gumroad-shelf__viewport');viewport.replaceChildren();
  const limit=Number(shelf.dataset.catalogueLimit)||products.length;
  for(const product of products.slice(0,limit)){
   const slide=document.createElement('article');slide.className='gumroad-shelf__slide';slide.dataset.toolId=product.id;
   const image=document.createElement('img');image.src=product.image;image.alt=product.imageAlt||product.title;image.loading='lazy';
   const title=document.createElement('strong');title.textContent=product.title;const summary=document.createElement('span');summary.textContent=product.summary;
   const buy=document.createElement('a');buy.className='gumroad-shelf__action button button--outline';buy.href=product.purchaseUrl;buy.target='_blank';buy.rel='noopener noreferrer';buy.textContent='Buy →';slide.append(image,title,summary,buy);viewport.append(slide);
  }
 }
}
export async function setupShelfCarousels(root){
 try{await populateOnline(root);}catch(error){console.error(error);}
 try{await populateStore(root);}catch(error){root.querySelectorAll('[data-gumroad-shelf]').forEach(shelf=>{shelf.hidden=true;});console.error(error);}
 root.querySelectorAll('[data-gumroad-shelf],[data-online-tools-shelf]').forEach(shelf=>{
  if(shelf.dataset.carouselReady)return;shelf.dataset.carouselReady='true';
  const slides=[...shelf.querySelectorAll('.gumroad-shelf__slide')];if(!slides.length)return;
  const nav=shelf.querySelector('.gumroad-shelf__nav'),arrows=[...nav.querySelectorAll('button')],count=nav.querySelector('output');
  const interval=shelf.hasAttribute('data-online-tools-shelf')?5000:3000;let index=0,timer,previous=-1;
  const render=()=>{slides.forEach((slide,i)=>{slide.getAnimations().forEach(a=>a.cancel());slide.hidden=i!==index;slide.inert=i!==index;});if(previous>=0&&previous!==index&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const outgoing=slides[previous];outgoing.hidden=false;outgoing.inert=true;const animation=outgoing.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:450,easing:'ease-in-out'});animation.onfinish=()=>{if(outgoing!==slides[index])outgoing.hidden=true;};slides[index].animate([{transform:'translateX(100%)'},{transform:'translateX(0)'}],{duration:450,easing:'ease-in-out'});}previous=index;if(count){count.textContent=`${index+1} / ${slides.length}`;count.setAttribute('aria-live','off');}};
  const sync=()=>{clearInterval(timer);if(!document.hidden&&!shelf.matches(':hover')&&!shelf.contains(document.activeElement)&&slides.length>1)timer=setInterval(()=>{index=(index+1)%slides.length;render();},interval);};
  arrows.forEach((button,i)=>button.addEventListener('click',()=>{index=(index+(i?1:-1)+slides.length)%slides.length;render();sync();}));
  shelf.addEventListener('mouseenter',sync);shelf.addEventListener('mouseleave',sync);shelf.addEventListener('focusin',sync);shelf.addEventListener('focusout',()=>queueMicrotask(sync));document.addEventListener('visibilitychange',sync);
  render();sync();
 });
}
