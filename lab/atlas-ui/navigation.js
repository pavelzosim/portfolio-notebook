/* One behavior owner for the candidate shell. No production navigation hooks. */
export function setupNavigation(page){
 const shell=document.querySelector('.shell');
 const readOutline=()=>[...document.querySelectorAll('#outline nav a[href^="#"]')]
  .map(link=>({link,target:document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(item=>item.target);
 let outline=readOutline();
 let frame=0;
 const select=()=>{
  frame=0;outline=readOutline();if(!outline.length)return;
  const edge=shell.getBoundingClientRect().height+48;
  let active=outline[0];
  for(const item of outline)if(item.target.getBoundingClientRect().top<=edge)active=item;
  const main=document.querySelector('main').getBoundingClientRect();
  if(main.bottom<=innerHeight-64)active=outline.at(-1);
  for(const item of outline){if(item===active)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');}
  if(page==='home'){
   const matching=[...document.querySelectorAll('.commander a')].find(a=>a.hash==='#'+active.target.id);
   const fallback=document.querySelector('.commander a[href="?page=home"],.commander a[href="/"]');
   for(const a of document.querySelectorAll('.commander a')){a.removeAttribute('aria-current');if(a===(matching||fallback))a.setAttribute('aria-current','location');}
  }
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(select);};
 const measure=()=>{document.documentElement.style.setProperty('--anchor-offset',`${Math.ceil(shell.getBoundingClientRect().height)+16}px`);schedule();};
 new ResizeObserver(measure).observe(shell);
 // Content/media can resize after initial parsing; selection must not assume fixed heights.
 new ResizeObserver(schedule).observe(document.querySelector('main'));
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});
 document.addEventListener('atlas:content-updated',schedule);
 document.querySelector('#outline nav')?.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  const target=document.getElementById(decodeURIComponent(link.hash.slice(1)));if(!target)return;
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  event.preventDefault();history.pushState(null,'',link.hash);
  if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
  target.focus({preventScroll:true});target.scrollIntoView({block:'start'});schedule();
 });
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable],dialog[open]'))return;
  const a=[...document.querySelectorAll('.commander a')].find(a=>a.querySelector('kbd').textContent===event.key);
  if(a){event.preventDefault();location.assign(a.href);}
 });
 measure();select();
}
