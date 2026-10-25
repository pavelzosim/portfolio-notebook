export function setupVfxGallery(vfx,{initialCount=8}={}){
 if(!vfx||vfx.dataset.galleryReady)return;vfx.dataset.galleryReady='true';
 const loops=[...vfx.querySelectorAll('.vfx-loop')],button=vfx.querySelector('[data-vfx-more]'),count=vfx.querySelector('[data-vfx-count]');
 loops.forEach((loop,index)=>{loop.hidden=index>=initialCount;});
 const render=()=>{count.textContent=`${loops.filter(el=>!el.hidden).length} / ${loops.length} loops visible`;};
 const visible=new Set();
 const sync=()=>{for(const loop of loops){const video=loop.querySelector('video');if(visible.has(video)&&!loop.hidden&&!document.hidden){if(!video.getAttribute('src'))video.src=video.dataset.src;video.play().catch(()=>{});}else video.pause();}};
 button.classList.add('button','button--quiet');button.addEventListener('click',()=>{loops.forEach(el=>el.hidden=false);button.hidden=true;render();sync();});
 const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting}of entries){if(isIntersecting)visible.add(target);else visible.delete(target);}sync();},{threshold:.15});
 loops.forEach(loop=>{
  for(const small of loop.querySelectorAll('figcaption small')){small.textContent=small.textContent.split('·').map(part=>part.trim()).filter(part=>!/(?:\b\d{1,2}:\d{2}\b|\.(?:mp4|mov|avi|webm)\b)/i.test(part)).join(' · ');if(!small.textContent)small.remove();}
  const video=loop.querySelector('video');video.controls=false;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.preload='none';video.removeAttribute('role');video.removeAttribute('aria-pressed');video.removeAttribute('tabindex');
  video.addEventListener('play',()=>{if(document.hidden||!visible.has(video)||loop.hidden)video.pause();});observer.observe(video);
 });document.addEventListener('visibilitychange',sync);render();
}
