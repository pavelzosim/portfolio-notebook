/* Homepage behavior only; the candidate shell owns navigation and keyboard routing. */
import {setupIntroSearch} from './intro-profile.js?v=review-100';
export function setupHomeInteractions(main,records){
 const lead=main.querySelector('.contact-lead');if(lead){lead.textContent=lead.textContent.replace(/\s*If this overlaps with a problem your team is solving, write directly\./,'').trim();}
 const slider=main.querySelector('[data-home-tools-slider]');
 if(slider){const cards=[...slider.querySelectorAll('.browser-tool-feature')];let index=0;
  const render=()=>{cards.forEach((card,i)=>{card.hidden=i!==index;card.inert=i!==index;});const output=slider.querySelector('output');output.textContent=`${index+1} / ${cards.length}`;output.setAttribute('aria-live','polite');};
  slider.querySelector('[data-home-tools-prev]').addEventListener('click',()=>{index=(index+cards.length-1)%cards.length;render();});
  slider.querySelector('[data-home-tools-next]').addEventListener('click',()=>{index=(index+1)%cards.length;render();});render();
 }
 const vfx=main.querySelector('[data-vfx-section]');
 if(vfx){const loops=[...vfx.querySelectorAll('.vfx-loop')],button=vfx.querySelector('[data-vfx-more]'),count=vfx.querySelector('[data-vfx-count]');
  loops.forEach((loop,index)=>{loop.hidden=index>=8;});
  const render=()=>{count.textContent=`${loops.filter(el=>!el.hidden).length} / ${loops.length} loops visible`;};
  button.classList.add('button','button--quiet');button.addEventListener('click',()=>{loops.forEach(el=>el.hidden=false);button.hidden=true;render();});
  const visible=new Set();
  const play=video=>{if(!video.getAttribute('src'))video.src=video.dataset.src;video.play().catch(()=>{});};
  const sync=()=>{for(const loop of loops){const video=loop.querySelector('video');if(visible.has(video)&&!loop.hidden&&!document.hidden)play(video);else video.pause();}};
  const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){if(isIntersecting)visible.add(target);else visible.delete(target);}sync();},{threshold:.15});
  loops.forEach(loop=>{
   for(const small of loop.querySelectorAll('figcaption small')){small.textContent=small.textContent.split('·').map(part=>part.trim()).filter(part=>!/(?:\b\d{1,2}:\d{2}\b|\.(?:mp4|mov|avi|webm)\b)/i.test(part)).join(' · ');if(!small.textContent)small.remove();}
   const video=loop.querySelector('video');video.controls=false;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.preload='none';video.removeAttribute('role');video.removeAttribute('aria-pressed');video.removeAttribute('tabindex');
   // Automatic previews pause offscreen and when the document is hidden.
   video.addEventListener('play',()=>{if(document.hidden||!visible.has(video)||loop.hidden)video.pause();});observer.observe(video);
  });
  document.addEventListener('visibilitychange',sync);render();
 }
 setupIntroSearch(main,{records});
}
